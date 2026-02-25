
import express from 'express'
import { employeelist, findallEmployee, findEmployee, } from '../services/Employee_service.js';

const employeeRouter= express.Router();

employeeRouter.post('/',employeelist)
employeeRouter.get('/allemployee',findallEmployee)
employeeRouter.get('/:id',findEmployee)

export default employeeRouter