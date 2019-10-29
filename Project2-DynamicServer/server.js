// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename + '\n');
        TestSQL();
    }
});

function TestSQL(){
    db.all("SELECT * FROM Consumption WHERE year =?", ["2017"], (err,rows) =>{
        //console.log(rows);
    });
}

app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
        // modify `response` here
        db.all("SELECT * FROM Consumption WHERE year =?", ["2017"], (err,rows) =>{
            var table = "";
            let cCount = 0;
            let gCount = 0;
            let nCount = 0;
            let pCount = 0;
            let rCount = 0; 
            for (var i = 0; i < rows.length; i++){
                
                cCount += rows[i]['coal'];  
                gCount += rows[i]['natural_gas'];
                nCount += rows[i]['nuclear']; 
                pCount += rows[i]['petroleum'];
                rCount += rows[i]['renewable'];
            }
            response = response.replace('!!COALCOUNT!!', cCount);
            response = response.replace('!!GASCOUNT!!', gCount);
            response = response.replace('!!NUCLEARCOUNT!!', nCount);
            response = response.replace('!!PETROLEUMCOUNT!!', pCount);
            response = response.replace('!!RENEWABLECOUNT!!', rCount);
            /*
            response = response.toString().replace('!!COALCOUNT!!', rows[0].coal);
            response = response.toString().replace('!!GASCOUNT!!', rows[0].natural_gas);
            response = response.toString().replace('!!NUCLEARCOUNT!!', rows[0].nuclear);
            response = response.toString().replace('!!PETROLEUMCOUNT!!', rows[0].petroleum);
            response = response.toString().replace('!!RENEWABLECOUNT!!', rows[0].renewable);
            */
            db.each("SELECT [state_abbreviation], [coal], [natural_gas], [nuclear], [petroleum], [renewable] FROM Consumption WHERE [year] = '2017' ORDER BY [state_abbreviation]", (err, row) => {
                console.log(row);
                table += "<tr>";
                for(var j = 0; j < row.length; j++){
                    table += "<td>" + row[j] + "</td>";
                }
                table += "</tr>";
            }, (err, data) => {
                if(err) {
                    console.log("Unable to to select with .each");
                }
                console.log("Table has " + data + " rows");
                response = response.toString().replace('!!TABLEBODY!!', table);
                console.log(response);
                WriteHtml(res, response);
            });
        });
    
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        // modify `response` here
        var year = req.params.selected_year;
        db.all("SELECT * FROM Consumption WHERE year = '" + year + "'", (err,rows) =>{


        });
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    let stateAbbriviation = req.params.selected_state;
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
        let imagePath = '/images/states/'+stateAbbriviation+'.jpg'; 
        response = response.replace(/!!STATE!!/g, stateAbbriviation); 
        response = response.replace(/!!STATEIMAGE!!/g, imagePath); 
        response = response.replace(/!!ALTSTATEIMAGE!!/g, 'State of ' + stateAbbriviation + ' image'); 

        //response = response.replace(/!!PrevStateAbbr!!/g, statePrevNext[stateAbbrName].prev);
        //response = response.replace(/!!NextStateAbbr!!/g, statePrevNext[stateAbbrName].next);
        var stateName = new Promise((resolve, reject) => {
            db.get("SELECT state_name FROM States WHERE state_abbreviation = ?", stateAbbriviation, (err, row) => {
                    let fullName = row.state_name;
                    response = response.replace('!!STATE!!', fullName);
                    resolve();
            });
        });
        var stateConsumption = new Promise((resolve, reject) => {
            db.all("SELECT * FROM Consumption WHERE state_abbreviation = ?", stateAbbriviation, (err, rows) => {
                //console.log(rows);
                let table = '';
                let row;
                let result = 0;
                for(var k = 0; k < rows.length; k++){
                    row = rows[i];
                    table += '<tr>';
                    for(var column of Object.keys(row)){
                        if(column !== 'state_abbreviation') {
                            table += '<td>' + row[column] + '</td>';
                            result += row[column];
                        }
                    }
                    table += '<td>' + total + '</td>';
                    table += '</tr>';
                }
                response = response.replace('!!STATETABLE!!', table);
                
                let coalCounts = [];
                let naturalGasCounts = [];
                let nuclearCounts = [];
                let petroleumCounts = [];
                let renewableCounts = [];
                let rowVar;
                for(var i = 0; i < rows.length; i++){
                    rowVar = rows[i];
                    coalCounts.push(rowVar.coal);
                    naturalGasCounts.push(rowVar.natural_gas);
                    nuclearCounts.push(rowVar.nuclear); //math.abs()
                    petroleumCounts.push(rowVar.petroleum);
                    renewableCounts.push(rowVar.renewable);
                }
                response = response.replace('!!COALCOUNTS!!', coalCounts);
                response = response.replace('!!GASCOUNTS!!', naturalGasCounts);
                response = response.replace('!!NUCLEARCOUNTS!!', nuclearCounts);
                response = response.replace('!!PETROLEUMCOUNTS!!', petroleumCounts);
                resolve();
            });
        });
        Promise.all([stateNamePromise, stateConsumptionPromise]).then((data) => {
            WriteHtml(res, response);
        })
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
        let type = req.params.selected_energy_type;
        let imagePath = '/images/energies/'+ type+'.jpg'; 
        response = response.replace(/!!!energy_type!!/g, type); 
        //response = response.replace(/!!ENERGYHEAD!!/g,energyNeatName[type].name);
        //response = response.replace(/!!ENERGYTYPE!!/g, energyNeatName[type].name);
        response = response.replace(/!!ENERGYIMAGE!!/g, imagePath); 
        //response = response.replace(/!!ALTENERGYIMAGE!!/g, energyNeatName[type].name+' image')
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);
