# Реалізація інформаційного та програмного забезпечення

У рамках проєкту розробляється:
- SQL-скрипти для створення та початкового наповнення бази даних;
- RESTfull сервіс для управління даними.


## SQL-скрипти
### main.sql
```sql
  CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    isActive BOOLEAN NOT NULL
);

CREATE TABLE Survey (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    creationDate DATETIME NOT NULL,
    closeDate DATETIME,
    userId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE Question (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    isRequired BOOLEAN NOT NULL,
    `order` INT NOT NULL,
    surveyId INT NOT NULL,
    FOREIGN KEY (surveyId) REFERENCES Survey(id) ON DELETE CASCADE
);

CREATE TABLE SurveyLink (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(100) NOT NULL UNIQUE,
    isActive BOOLEAN NOT NULL,
    expiryDate DATETIME,
    clicks INT NOT NULL DEFAULT 0,
    surveyId INT NOT NULL,
    FOREIGN KEY (surveyId) REFERENCES Survey(id) ON DELETE CASCADE
);

CREATE TABLE Response (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submissionDate DATETIME NOT NULL,
    isComplete BOOLEAN NOT NULL,
    surveyLinkId INT NOT NULL,
    FOREIGN KEY (surveyLinkId) REFERENCES SurveyLink(id) ON DELETE CASCADE
);

CREATE TABLE Answer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    value TEXT NOT NULL,
    responseId INT NOT NULL,
    questionId INT NOT NULL,
    FOREIGN KEY (responseId) REFERENCES Response(id) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES Question(id) ON DELETE CASCADE
);
```

### test_d.sql
```sql
  INSERT INTO User (email, passwordHash, role, isActive) VALUES
('admin@example.com', 'hash1', 'admin', TRUE),
('user1@example.com', 'hash2', 'respondent', TRUE),
('user2@example.com', 'hash3', 'respondent', TRUE);

INSERT INTO Survey (title, description, status, creationDate, closeDate, userId) VALUES
('Customer Satisfaction Survey', 'Tell us about your experience.', 'active', NOW(), NULL, 1),
('Product Feedback', 'We value your thoughts on our new product.', 'draft', NOW(), NULL, 1),
('Website Usability', 'How easy is it to use our website?', 'active', NOW(), NULL, 1);

INSERT INTO Question (text, type, isRequired, `order`, surveyId) VALUES
-- Survey 1
('How satisfied are you?', 'rating', TRUE, 1, 1),
('What can we improve?', 'text', FALSE, 2, 1),
-- Survey 2
('Is the product useful?', 'yesno', TRUE, 1, 2),
('Would you recommend it?', 'yesno', TRUE, 2, 2),
-- Survey 3
('Was the site easy to navigate?', 'yesno', TRUE, 1, 3),
('Any technical issues?', 'text', FALSE, 2, 3);

INSERT INTO SurveyLink (token, isActive, expiryDate, clicks, surveyId) VALUES
('link1', TRUE, DATE_ADD(NOW(), INTERVAL 10 DAY), 5, 1),
('link2', TRUE, DATE_ADD(NOW(), INTERVAL 5 DAY), 0, 1),
('link3', TRUE, DATE_ADD(NOW(), INTERVAL 15 DAY), 2, 2),
('link4', TRUE, DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 3);

INSERT INTO Response (submissionDate, isComplete, surveyLinkId) VALUES
(NOW(), TRUE, 1),
(NOW(), TRUE, 2),
(NOW(), FALSE, 3),
(NOW(), TRUE, 4);

-- Response 1 (link1, survey 1)
INSERT INTO Answer (value, responseId, questionId) VALUES
('4', 1, 1),
('More options needed.', 1, 2);

-- Response 2 (link2, survey 1)
INSERT INTO Answer (value, responseId, questionId) VALUES
('5', 2, 1),
('Nothing to improve.', 2, 2);

-- Response 3 (link3, survey 2) — incomplete, only one answer
INSERT INTO Answer (value, responseId, questionId) VALUES
('Yes', 3, 3);

-- Response 4 (link4, survey 3)
INSERT INTO Answer (value, responseId, questionId) VALUES
('Yes', 4, 5),
('No issues', 4, 6);
```

## RESTfull сервіс для управління даними
### Підключення до БД:
```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = pool;
```
### Контролери:
```js
const db = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Answer');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Answer WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Answer not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { value, responseId, questionId } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Answer (value, responseId, questionId) VALUES (?, ?, ?)',
            [value, responseId, questionId]
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
        const query = `UPDATE Answer SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        values.push(req.params.id);
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Answer not found' });
        res.json({ message: 'Answer updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Answer WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Answer not found' });
        res.json({ message: 'Answer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```
```js
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
```
```js
const db = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Response');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Response WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Response not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { submissionDate, isComplete, surveyLinkId } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Response (submissionDate, isComplete, surveyLinkId) VALUES (?, ?, ?)',
            [submissionDate, isComplete, surveyLinkId]
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
        const query = `UPDATE Response SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        values.push(req.params.id);
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Response not found' });
        res.json({ message: 'Response updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Response WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Response not found' });
        res.json({ message: 'Response deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```
```js
const db = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Survey');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Survey WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Survey not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { title, description, status, creationDate, closeDate, userId } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Survey (title, description, status, creationDate, closeDate, userId) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, status, creationDate, closeDate, userId]
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
        const query = `UPDATE Survey SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        values.push(req.params.id);
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Survey not found' });
        res.json({ message: 'Survey updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Survey WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Survey not found' });
        res.json({ message: 'Survey deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```
```js
const db = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM SurveyLink');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM SurveyLink WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'SurveyLink not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { token, isActive, expiryDate, clicks, surveyId } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO SurveyLink (token, isActive, expiryDate, clicks, surveyId) VALUES (?, ?, ?, ?, ?)',
            [token, isActive, expiryDate, clicks, surveyId]
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
        const query = `UPDATE SurveyLink SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        values.push(req.params.id);
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'SurveyLink not found' });
        res.json({ message: 'SurveyLink updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM SurveyLink WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'SurveyLink not found' });
        res.json({ message: 'SurveyLink deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```
```js
const db = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM User');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM User WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { email, passwordHash, role, isActive } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO User (email, passwordHash, role, isActive) VALUES (?, ?, ?, ?)',
            [email, passwordHash, role, isActive]
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
        const query = `UPDATE User SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
        values.push(req.params.id);
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM User WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```
### Маршрути:
```js
const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');

router.get('/', answerController.getAll);
router.get('/:id', answerController.getById);
router.post('/', answerController.create);
router.patch('/:id', answerController.update);
router.delete('/:id', answerController.remove);

module.exports = router;
```
```js
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.get('/', questionController.getAll);
router.get('/:id', questionController.getById);
router.post('/', questionController.create);
router.patch('/:id', questionController.update);
router.delete('/:id', questionController.remove);

module.exports = router;
```
```js
const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');

router.get('/', responseController.getAll);
router.get('/:id', responseController.getById);
router.post('/', responseController.create);
router.patch('/:id', responseController.update);
router.delete('/:id', responseController.remove);

module.exports = router;
```
```js
const express = require('express');
const router = express.Router();
const surveyLinkController = require('../controllers/surveyLinkController');

router.get('/', surveyLinkController.getAll);
router.get('/:id', surveyLinkController.getById);
router.post('/', surveyLinkController.create);
router.patch('/:id', surveyLinkController.update);
router.delete('/:id', surveyLinkController.remove);

module.exports = router;
```
```js
const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');

router.get('/', surveyController.getAll);
router.get('/:id', surveyController.getById);
router.post('/', surveyController.create);
router.patch('/:id', surveyController.update);
router.delete('/:id', surveyController.remove);

module.exports = router;
```
```js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.patch('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
```
### app.js:
```js
const express = require('express');
const app = express();

app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const questionRoutes = require('./routes/questionRoutes');
const surveyLinkRoutes = require('./routes/surveyLinkRoutes');
const responseRoutes = require('./routes/responseRoutes');
const answerRoutes = require('./routes/answerRoutes');

app.use('/api/users', userRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/surveylinks', surveyLinkRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/answers', answerRoutes);

app.get('/', (req, res) => {
    res.send('RESTful API для опитувань працює!');
});

module.exports = app;
```
### server.js:
```js
const app = require('./app');
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
```

