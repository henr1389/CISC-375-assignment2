/*
PACKAGE.JSON -> DONE
HOME PAGE -> DONE
YEAR PAGE -> DONE
STATE PAGE -> DONE
ENERGY SOURCE PAGE -> DONE
EARN 3 ADDITIONAL POINTS FOR EACH ITEM COMPLETED BELOW
Dynamically populate 'previous' and 'next' links in the year.html, state.html, and energy.html templates -> DONE
Dynamically populate the <h2> header of the state.html template to include the full name (rather than abbreviation) of the specific state being viewed -> DONE
Send a proper 404 error if the requested year, state, or energy source does not exist in the database
Can be plain text, but should be customized to the request (e.g. "Error: no data for state FB", or "Error: no data for year 2019")
Create a set of images (one for each state, and one for each energy source). Dynamically populate the <img> src and alt in the state.html and energy.html templates. -> DONE
*/

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
    }
});
app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
        // modify `response` here
        db.all("SELECT * FROM Consumption WHERE year =?", ["2017"], (err,rows) =>{
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
            response = response.replace("!!COALCOUNT!!", coal);
            response = response.replace("!!GASCOUNT!!", gas);
            response = response.replace("!!NUCLEARCOUNT!!", nuclear);
            response = response.replace("!!PETROLEUMCOUNT!!", petroleum);
            response = response.replace("!!RENEWABLECOUNT!!", renewable);
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
            //replace html TABLEBODY with table values
            response = response.toString().replace('!!TABLEBODY!!', tableValues);
            //console.log(response);
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
    //check to make sure year is within the correct range
    if (year >= 2017 && year <= 1960){
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.write('Error: ' + year + 'not in range');
        res.end();
    }
    else{
        ReadFile(path.join(template_dir, 'year.html')).then((template) => {
            let response = template;
            // modify `response` here
            //set previous and next year buttons
            response = response.replace(/!!CURRENTYEAR!!/g, year);
            if (year == 1960){
                response = response.replace("!!PREVIOUSYEAR!!", "1960");
                response = response.replace("!!NEXTYEAR!!", "1961");
            }else if(year == 2017){
            response = response.replace("!!PREVIOUSYEAR!!", "2016");
               response = response.replace("!!NEXTYEAR!!!", "2017");
            }else{
                response = response.replace("!!PREVIOUSYEAR!!", (year-1).toString());
                response = response.replace("!!NEXTYEAR!!", (year+1).toString());
            }
            db.all("SELECT * FROM Consumption WHERE year =?", [year], (err,rows) =>{
                let tableValues = "";
                let coal = 0;
                let gas = 0;
                let nuclear = 0;
                let petroleum = 0;
                let renewable = 0;
                let nextYear;
                let previousYear;
                let total = 0;
                let index;
                //get total counts for energy
                for (var i = 0; i < rows.length; i++){
                    index = rows[i];
                    coal += rows[i]['coal'];
                    gas += rows[i]['natural_gas'];
                    nuclear += rows[i]['nuclear'];
                    petroleum += rows[i]['petroleum'];
                    renewable += rows[i]['renewable'];
                }
                //assign each energy variable in the html document with its value
                response = response.replace("!!YEAR!!", year);
                response = response.replace("!!COALCOUNT!!", coal);
                response = response.replace("!!GASCOUNT!!", gas);
                response = response.replace("!!NUCLEARCOUNT!!", nuclear);
                response = response.replace("!!PETROLEUMCOUNT!!", petroleum);
                response = response.replace("!!RENEWABLECOUNT!!", renewable);

                //construct tabble string to replace in html document
                for (var j = 0; j < rows.length; j++){
                    tableValues += '<tr>';
                    tableValues += '<td>' + rows[j]['state_abbreviation'] + '</td>';
                    tableValues += '<td>' + rows[j]['coal'] + '</td>';
                    tableValues += '<td>' + rows[j]['natural_gas'] + '</td>';
                    tableValues += '<td>' + rows[j]['nuclear'] + '</td>';
                    tableValues += '<td>' + rows[j]['petroleum'] + '</td>';
                    tableValues += '<td>' + rows[j]['renewable'] + '</td>';
                    total = rows[j]['coal'] + rows[j]['natural_gas'] + rows[j]['nuclear'] +  rows[j]['petroleum'] + rows[j]['renewable'];
                    tableValues += '<td>' + total + '</td>';
                    tableValues += '</tr>'
                    total = 0;
                }
                //replace YEARTABLE in year.html document with tablevalues
                response = response.toString().replace(/!!YEARTABLE!!/g, tableValues);
                if(year == 1960){
                    previousYear = year;
                    nextYear = year + 1;
                }
                else if(year == 2017){
                    previousYear = year - 1;
                    nextYear = year;
                }
                else{
                    previousYear = year - 1;
                    nextYear = year + 1;
                }
                response = response.replace(/!!PREVIOUSYEAR!!/g, previousYear);
                response = response.replace(/!!NEXTYEAR!!/g, nextYear);
                WriteHtml(res, response);
            });
        }).catch((err) => {
            Write404Error(res);
        });
    }
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    var selectedState = req.params.selected_state;
    let nextState;
    let previousState;
    var fullName;
    var stateAbrev = ["AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", 
        "DE", "FL", "GA", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA",  
        "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE",  
        "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC",  
        "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY"]; 
    if (stateAbrev.indexOf(selectedState)==(-1)){
        Write404Error(res);
    }
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        db.get("SELECT state_name FROM States WHERE state_abbreviation = ?", [selectedState], (err, data) => {
            if(data != null){
                fullName = data.state_name;
                response = response.replace("!!STATE!!", fullName);
                response = response.replace("!!STATENAME!!", fullName);
            }
        });
        // modify `response` here
        let imagePath = '/images/pics/' + selectedState + '.jpg'; 
        //assign correct images to the states
        response = response.replace(/!!STATENAME!!/g, selectedState); 
        response = response.replace(/!!STATEIMAGE!!/g, imagePath); 
        response = response.replace(/!!ALTSTATEIMAGE!!/g, 'State of ' + selectedState + ' image');
        var position = stateAbrev.indexOf(selectedState);
        //assign the previous and next buttons to the correct states
        if(position == 0){
            response = response.replace("!!PREVIOUSSTATE!!", "WY");
            response = response.replace("!!PREVIOUSSTATE!!", "WY");
            response = response.replace("!!NEXTSTATE!!", "AL");
            response = response.replace("!!!NEXTSTATE!!", "AL");
        }else if(position==50){
            response = response.replace("!!PREVIOUSSTATE!!", "WV");
            response = response.replace("!!PREVIOUSSTATE!!", "WV");
            response = response.replace("!!NEXTSTATE!!", "AK");
            response = response.replace("!!!NEXTSTATE!!", "Ak");
        }else{
            response = response.replace("!!PREVIOUSSTATE!!", stateAbrev[position-1]);
            response = response.replace("!!PREVIOUSSTATE!!", stateAbrev[position-1]);
            response = response.replace("!!NEXTSTATE!!", stateAbrev[position+1]);
            response = response.replace("!!!NEXTSTATE!!", stateAbrev[position+1]);
        }

        db.all("SELECT * FROM Consumption WHERE state_abbreviation = ?", [selectedState], (err, rows) => {
            let tableValues = '';
            var coal = "[";
            var naturalGas = "[";
            var nuclear = "[";
            var petroleum = "[";
            var renewable = "[";
            let index;
            let total;
            let position;
            //fill out tableValues string 
            for(let i = 0; i < rows.length; i++){
                index = rows[i];
                total = 0;
                tableValues += '<tr>';
                for(let column of Object.keys(index)){
                    if(column !== 'state_abbreviation') {
                        tableValues += '<td>' + index[column] + '</td>';
                        total += index[column];
                    }
                }
                tableValues += '<td>' + total + '</td>';
                tableValues += '</tr>';
            }
            //replace variable in html document
            response = response.replace('!!STATETABLE!!', tableValues);    
            for(var i = 0; i < rows.length; i++){
                coal += rows[i]['coal'];
                naturalGas += rows[i]['natural_gas'];
                nuclear += rows[i]['nuclear'];
                petroleum += rows[i]['petroleum'];
                renewable += rows[i]['renewable'];
                if (i >= rows.length-1){
                    coal += "]";
                    naturalGas +="]";
                    nuclear +="]";
                    petroleum +="]";
                    renewable +="]";
                }else{
                    coal += ", ";
                    naturalGas +=", ";
                    nuclear +=", ";
                    petroleum +=", ";
                    renewable +=", ";
                }
            }
            response = response.replace("!!COALCOUNTS!!", coal);
            response = response.replace("!!GASCOUNTS!!", naturalGas);
            response = response.replace("!!NUCLEARCOUNTS!!", nuclear);
            response = response.replace("!!PETROLEUMCOUNTS!!", petroleum);
            response = response.replace("!!RENEWABLECOUNTS!!", renewable);
            response = response.replace("!!STATE!!", "\""+ selectedState+ "\"");
            WriteHtml(res, response);
        });
    }).catch((err) => {
        Write404Error(res);
    });
});

    
// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        var response = template;
        // modify `response` here
        let type = req.params.selected_energy_type;
        let pageArr= ["coal","natural_gas", "nuclear","petroleum", "renewable"];
        if (pageArr.indexOf(type)==(-1)){
            Write404Error(res);
        }
        let imagePath = '/images/energies/'+ type+'.jpg';
        var stateAbrev = ["AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC",
        "DE", "FL", "GA", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA",
        "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE",
        "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY"];
        //console.log(stateAbrev.length);
        //correctly assign previous and next buttons for energies
        let position = pageArr.indexOf(type);
        if (position == 0){
            response = response.replace("!!PREVIOUSENERGY_TYPE!!", "renewable");
            response = response.replace("!!PREVIOUSENERGY!!", "Renewable");
            response = response.replace("!!!NEXTENERGY!!", "natural_gas");
            response = response.replace("!!NEXTENERGY!!", "Natural Gas");
        }else if(position == 4){
            response = response.replace("!!PREVIOUSENERGY_TYPE!!", "petroleum");
            response = response.replace("!!PREVIOUSENERGY!!", "Petroleum");
            response = response.replace("!!!NEXTENERGY!!", "coal");
            response = response.replace("!!NEXTENERGY!!", "Coal");
        }else{
            response = response.replace("!!PREVIOUSENERGY_TYPE!!", pageArr[position-1]);
            response = response.replace("!!PREVIOUSENERGY!!", pageArr[position-1]);
            response = response.replace("!!!NEXTENERGY!!", pageArr[position+1]);
            response = response.replace("!!NEXTENERGY!!", pageArr[position+1]);
        }
        let energyImagePath = '/images/pics/'+ type+'.jpg';
        //assign the correct images for each energy
        response = response.replace("!!ENERGYIMAGE!!", energyImagePath);
        response = response.replace("!!ALTENERGYIMAGE!!", "picture of "+type);
        response = response.replace("!!ENERGYTITLE!!", type);
        response = response.replace("!!ENERGYHEAD!!", type);
        response = response.replace("!!ENERGYTYPE!!", type);
        response = response.replace("!!TYPE!!", type);
        let table = "";
        let temp = "";
        let tempTotal = 0;
        let tempYear = 1960;
        var currentState = 0;
        let nextPromise = new Promise (function(res,rej){
        var statesTotal= "{";
            db.all("SELECT "+ type.toString() +" FROM Consumption ORDER BY  state_abbreviation, year",  (err, rows) => {
                for (var i = 0; i<rows.length;i++){
                    var j = 0;
                    statesTotal += stateAbrev[currentState] + ": [";
                    currentState++;
                    while(j<=57&& i<rows.length){
                        if (j != 57){
                            statesTotal += rows[i][type] +", ";
                            j++
                            i++
                        }else{
                            statesTotal += rows[i][type];
                            j++
                        }
                    }
                    if(i >= rows.length-1){
                        statesTotal += "]";
                    }else{
                        statesTotal += "], ";
                    }


                }
                statesTotal += "}";
                response = response.replace("!!ENNERGYCOUNT!!", statesTotal);
                //console.log(response);
                res();
            });
        });
        let newPromise = new Promise (function(res,rej) {
            db.all("SELECT "+ type.toString() +" FROM Consumption Where year ORDER BY year, state_abbreviation",  (err, rows) => {

            for (let i = 0; i<rows.length; i++){
                let j = 0;
                table += "<tr>";
                table += "<td>"+(tempYear)+"</td>";
                while(j < 51 && i<rows.length){
                    temp = rows[i][type];
                    tempTotal += rows[i][type];
                    table += "<td>"+temp.toString()+ "</td>";

                    j++;
                    if (j!=51){
                       i++;
                    }

                }
                table += "<td>"+tempTotal+"</td></tr>";
                tempYear++;
                tempTotal = 0;
            }
            response = response.replace("!!ENERGYTABLE!!", table);
            res();
        });
    });
    Promise.all([newPromise, nextPromise]).then(function(){
        WriteHtml(res, response);
});
    }).catch((err) => {
        console.log(err);
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
