var express     = require('express'),
    bodyParser  = require('body-parser'),
    fs          = require('fs'),
    app         = express(),
    sprints   = JSON.parse(fs.readFileSync('data/sprints.json', 'utf-8')),
    states      = JSON.parse(fs.readFileSync('data/states.json', 'utf-8'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Would normally copy necessary scripts into src folder (via grunt/gulp) but serving
//node_modules directly to keep everything as simple as possible
app.use('/node_modules', express.static(__dirname + '/node_modules')); 

//The src folder has our static resources (index.html, css, images)
app.use(express.static(__dirname + '/src')); 

app.get('/api/sprints/page/:skip/:top', (req, res) => {
    const topVal = req.params.top,
          skipVal = req.params.skip,
          skip = (isNaN(skipVal)) ? 0 : +skipVal;  
    let top = (isNaN(topVal)) ? 10 : skip + (+topVal);

    if (top > sprints.length) {
        top = skip + (sprints.length - skip);
    }

    console.log(`Skip: ${skip} Top: ${top}`);

    var pagedSprints = sprints.slice(skip, top);
    res.setHeader('X-InlineCount', sprints.length);
    res.json(pagedSprints);
});

app.get('/api/sprints', (req, res) => {
    res.json(sprints);
});

app.get('/api/sprints/:id', (req, res) => {
    let sprintId = +req.params.id;
    let selectedSprint = {};
    for (let sprint of sprints) {
        if (sprint.id === sprintId) {
           selectedSprint = sprint;
           break;
        }
    }  
    res.json(selectedSprint);
});

app.post('/api/sprints', (req, res) => {
    let postedSprint = req.body;
    let maxId = Math.max.apply(Math,sprints.map((cust) => cust.id));
    postedSprint.id = ++maxId;
    postedSprint.gender = (postedSprint.id % 2 === 0) ? 'female' : 'male';
    sprints.push(postedSprint);
    res.json(postedSprint);
});

app.put('/api/sprints/:id', (req, res) => {
    let putSprint = req.body;
    let id = +req.params.id;
    let status = false;

    //Ensure state name is in sync with state abbreviation 
    const filteredStates = states.filter((state) => state.abbreviation === putSprint.state.abbreviation);
    if (filteredStates && filteredStates.length) {
        putSprint.state.name = filteredStates[0].name;
        console.log('Updated putSprint state to ' + putSprint.state.name);
    }

    for (let i=0,len=sprints.length;i<len;i++) {
        if (sprints[i].id === id) {
            sprints[i] = putSprint;
            status = true;
            break;
        }
    }
    res.json({ status: status });
});

app.delete('/api/sprints/:id', function(req, res) {
    let sprintId = +req.params.id;
    for (let i=0,len=sprints.length;i<len;i++) {
        if (sprints[i].id === sprintId) {
           sprints.splice(i,1);
           break;
        }
    }  
    res.json({ status: true });
});

app.get('/api/orders/:id', function(req, res) {
    let sprintId = +req.params.id;
    for (let cust of sprints) {
        if (cust.sprintId === sprintId) {
            return res.json(cust);
        }
    }
    res.json([]);
});

app.get('/api/states', (req, res) => {
    res.json(states);
});

app.post('/api/auth/login', (req, res) => {
    var userLogin = req.body;
    //Add "real" auth here. Simulating it by returning a simple boolean.
    res.json(true);
});

app.post('/api/auth/logout', (req, res) => {
    res.json(true);
});

// redirect all others to the index (HTML5 history)
app.all('/*', function(req, res) {
    res.sendFile(__dirname + '/src/index.html');
});

app.listen(3000);

console.log('Express listening on port 3000.');

//Open browser
var opn = require('opn');

opn('http://localhost:3000').then(() => {
    console.log('Browser closed.');
});


