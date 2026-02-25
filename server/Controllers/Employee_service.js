
import Employee from "../models/Employee.js";
import employeesData from "../employee.js";

export  const employeelist =async(req,res)=>{
    try {
        await Employee.insertMany(employeesData, { ordered: false });
        console.log("20 employee data inserted")
        res.json({ message: "Employee data inserted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }   
}


 export const findEmployee = async(req,res)=>{
    try {
        const {id} = req.params;
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
 }

export const findallEmployee= async(req,res)=>{
    try {
        const all=await Employee.find()
        res.json(all);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}