function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => !req.body[f] || String(req.body[f]).trim() === '');
    if (missing.length) {
      return res.status(400).json({ error: 'Missing or empty fields', fields: missing });
    }
    next();
  };
}

module.exports = { requireFields };
