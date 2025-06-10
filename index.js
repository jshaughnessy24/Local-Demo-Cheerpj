const expressGa = require('express-ga-middleware');
const express = require('express');
const app = express();
const PORT = 3000;

app.use(expressGa('UA-214456194-2'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/homepage.html')
});

app.get('/course/*', (req, res) => {
  res.redirect('/programpage.html?course='+req.params[0]);
});

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
