const pool = require('../config/db');

/**
 * Get all PCBs
 * GET /api/pcbs
 */
const getAllPCBs = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id, pcb_name, created_at 
       FROM pcbs 
       ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: { pcbs: result.rows }
        });
    } catch (error) {
        console.error('Get PCBs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching PCBs',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get single PCB by ID
 * GET /api/pcbs/:id
 */
const getPCBById = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const result = await client.query(
            'SELECT id, pcb_name, created_at FROM pcbs WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'PCB not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { pcb: result.rows[0] }
        });
    } catch (error) {
        console.error('Get PCB error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching PCB',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Create new PCB
 * POST /api/pcbs
 */
const createPCB = async (req, res) => {
    const client = await pool.connect();
    try {
        const { pcb_name } = req.body;

        // Validation
        if (!pcb_name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide pcb_name'
            });
        }

        // Check for duplicate pcb_name
        const duplicateCheck = await client.query(
            'SELECT id FROM pcbs WHERE pcb_name = $1',
            [pcb_name]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'PCB with this name already exists'
            });
        }

        // Insert PCB
        const result = await client.query(
            `INSERT INTO pcbs (pcb_name) 
       VALUES ($1) 
       RETURNING id, pcb_name, created_at`,
            [pcb_name]
        );

        res.status(201).json({
            success: true,
            message: 'PCB created successfully',
            data: { pcb: result.rows[0] }
        });
    } catch (error) {
        console.error('Create PCB error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating PCB',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Delete PCB
 * DELETE /api/pcbs/:id
 */
const deletePCB = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Check if PCB exists
        const pcbCheck = await client.query(
            'SELECT id FROM pcbs WHERE id = $1',
            [id]
        );

        if (pcbCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'PCB not found'
            });
        }

        // Delete PCB (CASCADE will handle related records)
        await client.query('DELETE FROM pcbs WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: 'PCB deleted successfully'
        });
    } catch (error) {
        console.error('Delete PCB error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting PCB',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get BOM for a PCB
 * GET /api/pcbs/:id/components
 */
const getPCBComponents = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Check if PCB exists
        const pcbCheck = await client.query(
            'SELECT id, pcb_name FROM pcbs WHERE id = $1',
            [id]
        );

        if (pcbCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'PCB not found'
            });
        }

        // Get components for this PCB
        const result = await client.query(
            `SELECT 
         pc.id as mapping_id,
         pc.quantity_per_pcb,
         c.id as component_id,
         c.name,
         c.part_number,
         c.current_stock,
         c.monthly_required_quantity
       FROM pcb_components pc
       JOIN components c ON pc.component_id = c.id
       WHERE pc.pcb_id = $1
       ORDER BY c.name`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                pcb: pcbCheck.rows[0],
                components: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Get PCB components error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching PCB components',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Add component to PCB BOM
 * POST /api/pcbs/:id/components
 */
const addComponentToPCB = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { component_id, quantity_per_pcb } = req.body;

        // Validation
        if (!component_id || !quantity_per_pcb) {
            return res.status(400).json({
                success: false,
                message: 'Please provide component_id and quantity_per_pcb'
            });
        }

        if (quantity_per_pcb <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity per PCB must be greater than 0'
            });
        }

        // Check if PCB exists
        const pcbCheck = await client.query(
            'SELECT id FROM pcbs WHERE id = $1',
            [id]
        );

        if (pcbCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'PCB not found'
            });
        }

        // Check if component exists
        const componentCheck = await client.query(
            'SELECT id, name FROM components WHERE id = $1',
            [component_id]
        );

        if (componentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }

        // Check for duplicate mapping
        const duplicateCheck = await client.query(
            'SELECT id FROM pcb_components WHERE pcb_id = $1 AND component_id = $2',
            [id, component_id]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'This component is already mapped to this PCB'
            });
        }

        // Insert mapping
        const result = await client.query(
            `INSERT INTO pcb_components (pcb_id, component_id, quantity_per_pcb) 
       VALUES ($1, $2, $3) 
       RETURNING id, pcb_id, component_id, quantity_per_pcb`,
            [id, component_id, quantity_per_pcb]
        );

        res.status(201).json({
            success: true,
            message: 'Component added to PCB successfully',
            data: {
                mapping: result.rows[0],
                component: componentCheck.rows[0]
            }
        });
    } catch (error) {
        console.error('Add component to PCB error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding component to PCB',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Update component quantity in PCB BOM
 * PUT /api/pcbs/:pcbId/components/:componentId
 */
const updatePCBComponent = async (req, res) => {
    const client = await pool.connect();
    try {
        const { pcbId, componentId } = req.params;
        const { quantity_per_pcb } = req.body;

        if (!quantity_per_pcb || quantity_per_pcb <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity per PCB must be greater than 0'
            });
        }

        const result = await client.query(
            `UPDATE pcb_components 
       SET quantity_per_pcb = $1 
       WHERE pcb_id = $2 AND component_id = $3
       RETURNING id, pcb_id, component_id, quantity_per_pcb`,
            [quantity_per_pcb, pcbId, componentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Component mapping not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Component quantity updated successfully',
            data: { mapping: result.rows[0] }
        });
    } catch (error) {
        console.error('Update PCB component error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating component quantity',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Remove component from PCB BOM
 * DELETE /api/pcbs/:pcbId/components/:componentId
 */
const removeComponentFromPCB = async (req, res) => {
    const client = await pool.connect();
    try {
        const { pcbId, componentId } = req.params;

        const result = await client.query(
            'DELETE FROM pcb_components WHERE pcb_id = $1 AND component_id = $2 RETURNING id',
            [pcbId, componentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Component mapping not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Component removed from PCB successfully'
        });
    } catch (error) {
        console.error('Remove component from PCB error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing component from PCB',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllPCBs,
    getPCBById,
    createPCB,
    deletePCB,
    getPCBComponents,
    addComponentToPCB,
    updatePCBComponent,
    removeComponentFromPCB
};
