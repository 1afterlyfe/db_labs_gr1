const db = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Question');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Question WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Question not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { text, type, isRequired, order, surveyId } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Question (text, type, isRequired, `order`, surveyId) VALUES (?, ?, ?, ?, ?)',
            [text, type, isRequired, order, surveyId]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update' });

    try {
        const query = `UPDATE Question SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        values.push(req.params.id);
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });
        res.json({ message: 'Question updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Question WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });
        res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};