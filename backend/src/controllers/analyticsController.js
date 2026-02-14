const pool = require('../config/db');

/**
 * Get component-wise consumption summary
 * GET /api/analytics/consumption-summary
 */
const getConsumptionSummary = async (req, res) => {
    const client = await pool.connect();
    try {
        const { startDate, endDate } = req.query;

        let query = `
      SELECT 
        c.id as component_id,
        c.name as component_name,
        c.part_number,
        c.current_stock,
        c.monthly_required_quantity,
        COALESCE(SUM(ch.quantity_deducted), 0) as total_consumed,
        COUNT(DISTINCT ch.production_log_id) as production_count
      FROM components c
      LEFT JOIN consumption_history ch ON c.id = ch.component_id
    `;

        const params = [];

        // Add date filtering if provided
        if (startDate && endDate) {
            query += ' WHERE ch.created_at BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        } else if (startDate) {
            query += ' WHERE ch.created_at >= $1';
            params.push(startDate);
        } else if (endDate) {
            query += ' WHERE ch.created_at <= $1';
            params.push(endDate);
        }

        query += `
      GROUP BY c.id, c.name, c.part_number, c.current_stock, c.monthly_required_quantity
      ORDER BY total_consumed DESC
    `;

        const result = await client.query(query, params);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: { consumptionSummary: result.rows }
        });
    } catch (error) {
        console.error('Get consumption summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consumption summary',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get top consumed components
 * GET /api/analytics/top-consumed
 */
const getTopConsumedComponents = async (req, res) => {
    const client = await pool.connect();
    try {
        const limit = parseInt(req.query.limit) || 10;

        const result = await client.query(
            `SELECT 
         c.id as component_id,
         c.name as component_name,
         c.part_number,
         c.current_stock,
         SUM(ch.quantity_deducted) as total_consumed,
         COUNT(DISTINCT ch.production_log_id) as times_used
       FROM components c
       JOIN consumption_history ch ON c.id = ch.component_id
       GROUP BY c.id, c.name, c.part_number, c.current_stock
       ORDER BY total_consumed DESC
       LIMIT $1`,
            [limit]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: { topComponents: result.rows }
        });
    } catch (error) {
        console.error('Get top consumed components error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top consumed components',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get low stock components
 * GET /api/analytics/low-stock
 */
const getLowStockComponents = async (req, res) => {
    const client = await pool.connect();
    try {
        // Components where stock is below 20% of monthly required quantity
        const result = await client.query(
            `SELECT 
         id,
         name,
         part_number,
         current_stock,
         monthly_required_quantity,
         ROUND((current_stock::decimal / NULLIF(monthly_required_quantity, 0)) * 100, 2) as stock_percentage
       FROM components
       WHERE monthly_required_quantity > 0 
         AND current_stock < (monthly_required_quantity * 0.2)
       ORDER BY stock_percentage ASC`
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: { lowStockComponents: result.rows }
        });
    } catch (error) {
        console.error('Get low stock components error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock components',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get procurement triggers/alerts
 * GET /api/analytics/procurement-alerts
 */
const getProcurementAlerts = async (req, res) => {
    const client = await pool.connect();
    try {
        const { status = 'open' } = req.query;

        const result = await client.query(
            `SELECT 
         pt.id,
         pt.component_id,
         c.name as component_name,
         c.part_number,
         c.current_stock,
         c.monthly_required_quantity,
         pt.trigger_date,
         pt.status
       FROM procurement_triggers pt
       JOIN components c ON pt.component_id = c.id
       WHERE pt.status = $1
       ORDER BY pt.trigger_date DESC`,
            [status]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: { procurementAlerts: result.rows }
        });
    } catch (error) {
        console.error('Get procurement alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching procurement alerts',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Resolve procurement trigger
 * PUT /api/analytics/procurement-alerts/:id/resolve
 */
const resolveProcurementAlert = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const result = await client.query(
            `UPDATE procurement_triggers 
       SET status = 'resolved' 
       WHERE id = $1 AND status = 'open'
       RETURNING id, component_id, trigger_date, status`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Procurement alert not found or already resolved'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Procurement alert resolved successfully',
            data: { procurementAlert: result.rows[0] }
        });
    } catch (error) {
        console.error('Resolve procurement alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resolving procurement alert',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get production statistics
 * GET /api/analytics/production-stats
 */
const getProductionStats = async (req, res) => {
    const client = await pool.connect();
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = 'WHERE pl.produced_at BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        } else if (startDate) {
            dateFilter = 'WHERE pl.produced_at >= $1';
            params.push(startDate);
        } else if (endDate) {
            dateFilter = 'WHERE pl.produced_at <= $1';
            params.push(endDate);
        }

        const result = await client.query(
            `SELECT 
         p.id as pcb_id,
         p.pcb_name,
         COUNT(pl.id) as production_runs,
         SUM(pl.quantity_produced) as total_quantity_produced
       FROM pcbs p
       LEFT JOIN production_logs pl ON p.id = pl.pcb_id
       ${dateFilter}
       GROUP BY p.id, p.pcb_name
       ORDER BY total_quantity_produced DESC NULLS LAST`,
            params
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: { productionStats: result.rows }
        });
    } catch (error) {
        console.error('Get production stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching production statistics',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getConsumptionSummary,
    getTopConsumedComponents,
    getLowStockComponents,
    getProcurementAlerts,
    resolveProcurementAlert,
    getProductionStats
};
