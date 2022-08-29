const path = require("path")
const fs = require("fs");

const tx_util = require("./modules/ethers-tx-util");

const express = require('express')

const port = 3000
const PROJECT_PATH = path.join(__dirname,"projects")

const app = express()
const index_html = fs.readFileSync(path.join(__dirname,"index.html"),"utf-8");
const toLink = (link,name=link) => `<a href="/${link}">${name}</a>`
const toLinks = (links) => links.map(l=>toLink(l)).join("")
const html_with_nav = index_html.replace('{{nav}}', toLink("","Home") + toLinks(getProjects()));

const clients = {};
const project_modules = importProjects();

/** import projects */
function getProjectFiles(){
    return fs.readdirSync(PROJECT_PATH).filter(p=>path.extname(p) == ".js")
}
function getProjectPaths(){
    return getProjectFiles().map(p=>path.join(PROJECT_PATH,p));
}
function getProjects(){
    return getProjectFiles().map(p=>p.slice(0,-3))
}

function importProjects(){
    const project_modules = {}
    const project_paths = getProjectPaths()
    const projects = getProjects()
    for(let i=0;i<project_paths.length;i++){
        project_modules[projects[i]] = require(project_paths[i]);
    }
    return project_modules;
}

/** html handle functions */
const toTable = (kvPair) => {
    let table = '<table style="border 1px">'
    if(kvPair["page"]) {
        table += `<tr><th></th><th>${kvPair["page"]}</th></tr>`
        delete kvPair["page"];
    };
    for(k in kvPair){
        table += "<tr>"
        table += `<td>${k}</td><td>${kvPair[k]}</td>`
        table += "</tr>"
    }
    table += "</table>"
    return table;
}

const toScript = (url) => {
    return `
    const sse = new EventSource("${url}/subscribe");
    const table = document.getElementById("table");
    sse.onmessage = (e)=>{
        console.log("on message")
        console.log(table)
        table.innerHTML = e.data
    }`
}

/** 
 * 
 * get functions from projects 
 * 
 */ 
const getData = async (project) => {
    let data = {empty:"data",test:[1,2,3]};
    try {
        data = await (project_modules[project].getData());
    } catch (error) {
        // console.error(error);
        console.warn("error on ",project," getData");
    }
    return data;
}

const listening = (project) => {
    let listener = {};
    try {
        listener = project_modules[project].listening((data) => sendEventsToAll(project,toTable(data)));
    } catch (error) {
        console.error(error);
        console.warn("error on ",project," listening");
    }
    return listener;
}

async function isListening(project){
    try {
        if (await clients[project].listener.isConnected() && clients[project].listener._events.length > 0) return true;
        else {
            clients[project].closeConnection();
            return false;
        }
    } catch {
        return false;
    }
}

/** page */
app.get('/', (req, res) => {
    const html_result = html_with_nav.replace("{{table}}","index page")
    res.send(html_result)
})

// project page
getProjects().forEach(project=>{
    const url = "/" + project
    // subscribe page
    app.get(url+"/subscribe", (req,res) => {
        // send headers to keep connection alive
        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };
        res.writeHead(200, headers);
        const clientId = project+"_"+Date.now();
        
        if(clients[project] == undefined){
            clients[project] = {res:[]};
        }

        // subscribe when the project is not listening
        isListening(project).then(is => {
            if(!is){
                const listener = listening(project,clients[project]);
                clients[project].listener = listener;
            }
        })

        // store client response for sse
        const newClient = { id : clientId, res }
        clients[project].res.push(newClient)
        
        req.on('close', () => {
            console.log(`${clientId} Connection closed`);
            clients[project].res = clients[project].res.filter(client => client.id !== clientId);
        });
    })

    // page
    app.get(url, async (req,res) => {
        data = await getData(project);
        let html_result = html_with_nav.replace("{{script}}",toScript(url));
        html_result = html_result.replace("{{table}}",toTable(data))
        res.write(html_result);
        res.end()
    })
})

// send event to 
function sendEventsToAll(project,data) {
    console.log("broadcast",clients[project].res.map(c => c.id))
    clients[project].res.forEach(client => {
        client.res.write(`data: ${data}\n\n`)
    })
}

app.get("/test",(req,res)=>{
    res.send("hi")
    sendEventsToAll("test-sample",Date.now())
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
