import axios from "axios";
export const api = axios.create({baseURL:"http://localhost:8000"});
export async function getEquipment(){return (await api.get("/api/equipment")).data}
export async function getOverview(){return (await api.get("/api/analytics/overview")).data}
export async function getAlerts(){return (await api.get("/api/alerts")).data}
export async function getStatus(){return (await api.get("/api/system/status")).data}
export async function getTelemetry(id:string){return (await api.get(`/api/equipment/${id}/telemetry`)).data}
export async function runDemo(id:string){return (await api.post(`/api/demo/${id}`)).data}
