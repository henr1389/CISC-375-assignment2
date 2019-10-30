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
            let tableValues = "";
            let coal = 0;
            let gas = 0;
            let nuclear = 0;
            let petroleum = 0;
            let renewable = 0;
            //get total counts for each energy 
            for (var i = 0; i < rows.length; i++){
                coal += rows[i]['coal'];  
                gas += rows[i]['natural_gas'];
                nuclear += rows[i]['nuclear']; 
                petroleum += rows[i]['petroleum'];
                renewable += rows[i]['renewable'];
            }
            //Dynamically populate the JavaScript variables in the index.html template
            response = response.replace(/!!COALCOUNT!!/g, coal);
            response = response.replace(/!!GASCOUNT!!/g, gas);
            response = response.replace(/!!NUCLEARCOUNT!!/g, nuclear);
            response = response.replace(/!!PETROLEUMCOUNT!!/g, petroleum);
            response = response.replace(/!!RENEWABLECOUNT!!/g, renewable);

            //Dynamically populate the body of the table in the index.html template with proper state consumptions
            for (var j = 0; j < rows.length; j++){
                tableValues += '<tr>'; 
                tableValues += '<td>' + rows[j]['state_abbreviation'] + '</td>';
                tableValues += '<td>' + rows[j]['coal'] + '</td>';
                tableValues += '<td>' + rows[j]['natural_gas'] + '</td>';
                tableValues += '<td>' + rows[j]['nuclear'] + '</td>';
                tableValues += '<td>' + rows[j]['petroleum'] + '</td>';
                tableValues += '<td>' + rows[j]['renewable'] + '</td>';
                tableValues += '</tr>'
            }
            response = response.toString().replace('!!TABLEBODY!!', tableValues);
            console.log(response);
            WriteHtml(res, response);
        });
    
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    let selectYear = req.params.selected_year;
    let year = parseInt(selectYear);
    if (year <= 2017 && year >= 1960){
        ReadFile(path.join(template_dir, 'year.html')).then((template) => {
            let response = template;
            // modify `response` here
        
            db.all("SELECT * FROM Consumption WHERE year =?", [year], (err,rows) =>{
                let tableValues = "";
                let coal = 0;
                let gas = 0;
                let nuclear = 0;
                let petroleum = 0;
                let renewable = 0;
                for (var i = 0; i < rows.length; i++){
                    coal += rows[i]['coal'];  
                    gas += rows[i]['natural_gas'];
                    nuclear += rows[i]['nuclear']; 
                    petroleum += rows[i]['petroleum'];
                    renewable += rows[i]['renewable'];
                }
                response = response.replace(/!!COALCOUNT!!/g, coal);
                response = response.replace(/!!GASCOUNT!!/g, gas);
                response = response.replace(/!!NUCLEARCOUNT!!/g, nuclear);
                response = response.replace(/!!PETROLEUMCOUNT!!/g, petroleum);
                response = response.replace(/!!RENEWABLECOUNT!!/g, renewable);

                for (var j = 0; j < rows.length; j++){
                    tableValues += '<tr>'; 
                    tableValues += '<td>' + rows[j]['state_abbreviation'] + '</td>';
                    tableValues += '<td>' + rows[j]['coal'] + '</td>';
                    tableValues += '<td>' + rows[j]['natural_gas'] + '</td>';
                    tableValues += '<td>' + rows[j]['nuclear'] + '</td>';
                    tableValues += '<td>' + rows[j]['petroleum'] + '</td>';
                    tableValues += '<td>' + rows[j]['renewable'] + '</td>';
                    tableValues += '</tr>'
                }
                response = response.toString().replace('!!YEARTABLE!!', tableValues);
                console.log(response);
                WriteHtml(res, response);
            });
        
        }).catch((err) => {
            Write404Error(res);
        });
    }
    else{

    }
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
                    //for(var column of Object.keys(row)){
                        //if(column !== 'state_abbreviation') {
                          //  table += '<td>' + row[column] + '</td>';
                          //  result += row[column];
                       // }
                   // }
                   // table += '<td>' + total + '</td>';
                   // table += '</tr>';
                }
                response = response.replace('!!STATETABLE!!', table);
                
                let coal = [];
                let naturalGas = [];
                let nuclear = [];
                let petroleum = [];
                let renewable = [];
                let rowVar;
                for(var i = 0; i < rows.length; i++){
                    rowVar = rows[i];
                    coalCounts.push(rowVar.coal);
                    naturalGasCounts.push(rowVar.natural_gas);
                    nuclearCounts.push(rowVar.nuclear); //math.abs()
                    petroleumCounts.push(rowVar.petroleum);
                    renewableCounts.push(rowVar.renewable);
                }
                response = response.replace(/!!COALCOUNTS!!/g, coalCounts);
                response = response.replace(/!!GASCOUNTS!!/g, naturalGasCounts);
                response = response.replace(/!!NUCLEARCOUNTS!!/g, nuclearCounts);
                response = response.replace(/!!PETROLEUMCOUNTS!!/g, petroleumCounts);
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
        //response = response.replace(/!!ENERGYHEAD!!/g,energy[type].name);
        //response = response.replace(/!!ENERGYTYPE!!/g, energy[type].name);
        response = response.replace(/!!ENERGYIMAGE!!/g, imagePath); 
        //response = response.replace(/!!ALTENERGYIMAGE!!/g, [type].name+' image')
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
