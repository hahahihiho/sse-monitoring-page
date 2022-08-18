const path = require("path")
const fs = require("fs");
const express = require('express')

const app = express()
const port = 3000

const PROJECT_PATH = "projects"
const project_list = fs.readdirSync(path.join(__dirname,PROJECT_PATH));
const index_html = fs.readFileSync(path.join(__dirname,"index.html"),"utf-8");
const toLink = (link,name=link) => `<a href="/${link}">${name}</a>`
const toLinks = (links) => links.map(l=>toLink(l)).join("")
const html_with_nav = index_html.replace('{{nav}}', toLink("","Home") + toLinks(project_list.map(p=>p.split(".")[0])));

const clients = {};
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

/** get functions from projects */
const getData = async (project_file) => {
    let data;
    const module_path = "./"+path.join(PROJECT_PATH,project_file)
    try {
        data = await (require(module_path).getData());
    } catch (error) {
        // console.error(error);
        console.warn("no module ",module_path);
        data = {empty:"data",test:[1,2,3]};
    }
    // data["page"] = project_file.split(".")[0];
    return data;
}

const listening = (project_file) => {
    let listener = {};
    const project = project_file.split(".")[0];
    const module_path = "./"+path.join(PROJECT_PATH,project_file)
    try {
        listener = require(module_path).listening((data) => sendEventsToAll(project,toTable(data)));
        listener._websocket.on("error",err => {
            console.error("There is connection issue");
            console.error(err);
        }) // connection issue
    } catch (error) {
        console.warn("no module ",module_path);
    }
    return listener;
}

function eventExists(project){
    try {
        if (clients[project].listener._events.length > 0) return true;
        else return false;
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
project_list.forEach(project_file=>{
    const project = project_file.split(".")[0]
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
        
        // subscribe once per project
        /**
         *  When does the listening would be called
         *  1. at the first time : clients[project] == undefined
         *  2. listener's _events are broken : check clients[project].listener.provider._events length == 0
         */
        if(clients[project] == undefined){
            clients[project] = {res:[]};
        }
        if(!eventExists(project)){
            const listener = listening(project_file,clients[project]);
            clients[project].listener = listener;
        }
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
        data = await getData(project_file);
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