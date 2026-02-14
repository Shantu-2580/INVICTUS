const pool = require('../config/db');

/**
 * Get all components
 * GET /api/components
 */
const getAllComponents = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id, name, part_number, current_stock, monthly_required_quantity, created_at 
       FROM components 
       ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: { components: result.rows }
        });
    } catch (error) {
        console.error('Get components error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching components',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get single component by ID
 * GET /api/components/:id
 */
const getComponentById = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const result = await client.query(
            `SELECT id, name, part_number, current_stock, monthly_required_quantity, created_at 
       FROM components 
       WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { component: result.rows[0] }
        });
    } catch (error) {
        console.error('Get component error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching component',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Create new component
 * POST /api/components
 */
const createComponent = async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, part_number, current_stock = 0, monthly_required_quantity = 0 } = req.body;

        // Validation
        if (!name || !part_number) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name and part_number'
            });
        }

        // Validate stock values
        if (current_stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Current stock cannot be negative'
            });
        }

        if (monthly_required_quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Monthly required quantity cannot be negative'
            });
        }

        // Check for duplicate part_number
        const duplicateCheck = await client.query(
            'SELECT id FROM components WHERE part_number = $1',
            [part_number]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Component with this part number already exists'
            });
        }

        // Insert component
        const result = await client.query(
            `INSERT INTO components (name, part_number, current_stock, monthly_required_quantity) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, part_number, current_stock, monthly_required_quantity, created_at`,
            [name, part_number, current_stock, monthly_required_quantity]
        );

        res.status(201).json({
            success: true,
            message: 'Component created successfully',
            data: { component: result.rows[0] }
        });
    } catch (error) {
        console.error('Create component error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating component',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Update component
 * PUT /api/components/:id
 */
const updateComponent = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, part_number, current_stock, monthly_required_quantity } = req.body;

        // Check if component exists
        const componentCheck = await client.query(
            'SELECT id FROM components WHERE id = $1',
            [id]
        );

        if (componentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }

        // Validate stock values if provided
        if (current_stock !== undefined && current_stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Current stock cannot be negative'
            });
        }

        if (monthly_required_quantity !== undefined && monthly_required_quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Monthly required quantity cannot be negative'
            });
        }

        // Check for duplicate part_number if updating
        if (part_number) {
            const duplicateCheck = await client.query(
                'SELECT id FROM components WHERE part_number = $1 AND id != $2',
                [part_number, id]
            );

            if (duplicateCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Another component with this part number already exists'
                });
            }
        }

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }
        if (part_number !== undefined) {
            updates.push(`part_number = $${paramCount}`);
            values.push(part_number);
            paramCount++;
        }
        if (current_stock !== undefined) {
            updates.push(`current_stock = $${paramCount}`);
            values.push(current_stock);
            paramCount++;
        }
        if (monthly_required_quantity !== undefined) {
            updates.push(`monthly_required_quantity = $${paramCount}`);
            values.push(monthly_required_quantity);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);
        const query = `
      UPDATE components 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, part_number, current_stock, monthly_required_quantity, created_at
    `;

        const result = await client.query(query, values);

        res.status(200).json({
            success: true,
            message: 'Component updated successfully',
            data: { component: result.rows[0] }
        });
    } catch (error) {
        console.error('Update component error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating component',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Delete component
 * DELETE /api/components/:id
 */
const deleteComponent = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Check if component exists
        const componentCheck = await client.query(
            'SELECT id FROM components WHERE id = $1',
            [id]
        );

        if (componentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }

        // Delete component (CASCADE will handle related records)
        await client.query('DELETE FROM components WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: 'Component deleted successfully'
        });
    } catch (error) {
        console.error('Delete component error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting component',
            error: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getAllComponents,
    getComponentById,
    createComponent,
    updateComponent,
    deleteComponent
};
