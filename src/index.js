const { request } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

// Array to save data
const customers = [];

// Create first Middleware
function verifyAccount(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer) {
        return response.status(400).json({ error: "customer not found" });
    }

    // send customer for all middleware users
    request.customer = customer;

    return next();
} 

function getBalance(statement) {
    const balance = statement.reduce((accumulator, operation) => {
        if(operation.type === "credit") {
            return accumulator + operation.amount;
        } else {
            return accumulator - operation.amount;
        }

    }, 0)
    
    return balance;
}

/*
* cpf  - string
* name - string
* id - uuid
* statement - []
*/
app.post("/account", (request, response) => {
    const {cpf, name } = request.body;
    const id = uuidv4();

    const already = customers.some((customer) => customer.cpf === cpf );

    if(already) {
    return response.status(400).json({ error: "Customer already exists!" });
    }

    customers.push({
        cpf, name, id, statement: []
    });

    return response.status(201).send();
});

app.get("/statement", verifyAccount, (request, response) => {
    // get customer from middleware
    const { customer } = request;

    return response.json(customer.statement);
});

app.post("/deposit", verifyAccount, (request, response) => {
    const { customer } = request;

    const { description, amount } = request.body;
    const operation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit",
    }

    customer.statement.push(operation);

    return response.status(201).send();
});

app.post('/withdraw', verifyAccount, (request, response) => {
    const { customer } = request;
    const { amount } = request.body;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({ error: "Insufficient funds!" });
    }

    const operation = {
        amount,
        created_at: new Date(),
        type: "debit",
    }

    customer.statement.push(operation);

    return response.status(201).send();
});

app.get('/statement/date', verifyAccount, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString() );

    return response.json(customer.statement);
});

app.put('/account', verifyAccount, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

app.get("/account", verifyAccount, (request, response) => {
    const { customer } = request;

    return response.json(customer);
});

app.delete("/account", verifyAccount, (request, response) => {
    const { customer } = request;

    //splice
    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

app.get("/balance", verifyAccount, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    console.log(balance);
    

    return response.json(balance);
});

app.listen(3333)