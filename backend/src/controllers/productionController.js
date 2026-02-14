const pool = require('../config/db');

/**
 * Get all production logs
 * GET /api/production
 */
const getAllProductionLogs = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT 
         pl.id,
         pl.pcb_id,
         p.pcb_name,
         pl.quantity_produced,
         pl.produced_at
       FROM production_logs pl
       JOIN pcbs p ON pl.pcb_id = p.id
       ORDER BY pl.produced_at DESC`
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: { productionLogs: result.rows }
        });
    } catch (error) {
        console.error('Get production logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching production logs',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Record production and deduct stock (CRITICAL - Transaction Safe)
 * POST /api/production
 */
const recordProduction = async (req, res) => {
    const client = await pool.connect();

    try {
        const { pcb_id, quantity_produced } = req.body;

        // Validation
        if (!pcb_id || !quantity_produced) {
            return res.status(400).json({
                success: false,
                message: 'Please provide pcb_id and quantity_produced'
            });
        }

        if (quantity_produced <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity produced must be greater than 0'
            });
        }

        // START TRANSACTION
        await client.query('BEGIN');

        // 1. Check if PCB exists
        const pcbCheck = await client.query(
            'SELECT id, pcb_name FROM pcbs WHERE id = $1',
            [pcb_id]
        );

        if (pcbCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'PCB not found'
            });
        }

        // 2. Fetch PCB BOM (components required for this PCB)
        const bomResult = await client.query(
            `SELECT 
         pc.component_id,
         pc.quantity_per_pcb,
         c.name as component_name,
         c.part_number,
         c.current_stock,
         c.monthly_required_quantity
       FROM pcb_components pc
       JOIN components c ON pc.component_id = c.id
       WHERE pc.pcb_id = $1`,
            [pcb_id]
        );

        if (bomResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'PCB has no components in BOM. Cannot proceed with production.'
            });
        }

        const bom = bomResult.rows;

        // 3. Calculate required quantities and check stock availability
        const insufficientStock = [];
        const stockDeductions = [];

        for (const item of bom) {
            const requiredQty = item.quantity_per_pcb * quantity_produced;

            if (item.current_stock < requiredQty) {
                insufficientStock.push({
                    component: item.component_name,
                    part_number: item.part_number,
                    required: requiredQty,
                    available: item.current_stock,
                    shortage: requiredQty - item.current_stock
                });
            } else {
                stockDeductions.push({
                    component_id: item.component_id,
                    component_name: item.component_name,
                    quantity_to_deduct: requiredQty,
                    current_stock: item.current_stock,
                    new_stock: item.current_stock - requiredQty,
                    monthly_required_quantity: item.monthly_required_quantity
                });
            }
        }

        // 4. If insufficient stock, reject production
        if (insufficientStock.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock for production',
                data: { insufficientStock }
            });
        }

        // 5. Insert production log
        const productionLogResult = await client.query(
            `INSERT INTO production_logs (pcb_id, quantity_produced) 
       VALUES ($1, $2) 
       RETURNING id, pcb_id, quantity_produced, produced_at`,
            [pcb_id, quantity_produced]
        );

        const productionLog = productionLogResult.rows[0];

        // 6. Deduct stock and insert consumption history
        const consumptionRecords = [];
        const procurementTriggers = [];

        for (const deduction of stockDeductions) {
            // Deduct stock
            await client.query(
                'UPDATE components SET current_stock = current_stock - $1 WHERE id = $2',
                [deduction.quantity_to_deduct, deduction.component_id]
            );

            // Insert consumption history
            const consumptionResult = await client.query(
                `INSERT INTO consumption_history (component_id, production_log_id, quantity_deducted) 
         VALUES ($1, $2, $3) 
         RETURNING id, component_id, production_log_id, quantity_deducted, created_at`,
                [deduction.component_id, productionLog.id, deduction.quantity_to_deduct]
            );

            consumptionRecords.push(consumptionResult.rows[0]);

            // 7. Check if procurement trigger needed (stock < 20% of monthly requirement)
            const threshold = deduction.monthly_required_quantity * 0.2;

            if (deduction.new_stock < threshold && deduction.monthly_required_quantity > 0) {
                // Check if open procurement trigger already exists
                const existingTrigger = await client.query(
                    `SELECT id FROM procurement_triggers 
           WHERE component_id = $1 AND status = 'open'`,
                    [deduction.component_id]
                );

                // Create new trigger only if none exists
                if (existingTrigger.rows.length === 0) {
                    const triggerResult = await client.query(
                        `INSERT INTO procurement_triggers (component_id, status) 
             VALUES ($1, 'open') 
             RETURNING id, component_id, trigger_date, status`,
                        [deduction.component_id]
                    );

                    procurementTriggers.push({
                        ...triggerResult.rows[0],
                        component_name: deduction.component_name,
                        new_stock: deduction.new_stock,
                        threshold: threshold
                    });
                }
            }
        }

        // COMMIT TRANSACTION
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Production recorded successfully',
            data: {
                productionLog,
                pcb_name: pcbCheck.rows[0].pcb_name,
                stockDeductions,
                consumptionRecords,
                procurementTriggers: procurementTriggers.length > 0 ? procurementTriggers : null
            }
        });

    } catch (error) {
        // ROLLBACK on any error
        await client.query('ROLLBACK');
        console.error('Record production error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording production. Transaction rolled back.',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get production log by ID with details
 * GET /api/production/:id
 */
const getProductionLogById = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Get production log
        const logResult = await client.query(
            `SELECT 
         pl.id,
         pl.pcb_id,
         p.pcb_name,
         pl.quantity_produced,
         pl.produced_at
       FROM production_logs pl
       JOIN pcbs p ON pl.pcb_id = p.id
       WHERE pl.id = $1`,
            [id]
        );

        if (logResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Production log not found'
            });
        }

        // Get consumption details
        const consumptionResult = await client.query(
            `SELECT 
         ch.id,
         ch.component_id,
         c.name as component_name,
         c.part_number,
         ch.quantity_deducted,
         ch.created_at
       FROM consumption_history ch
       JOIN components c ON ch.component_id = c.id
       WHERE ch.production_log_id = $1`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                productionLog: logResult.rows[0],
                consumption: consumptionResult.rows
            }
        });
    } catch (error) {
        console.error('Get production log error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching production log',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllProductionLogs,
    recordProduction,
    getProductionLogById
};
