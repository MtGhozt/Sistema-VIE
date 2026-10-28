import { apiJson } from "./client";

export type DemoRoleRow = {
  codigo: string;
  nombre: string;
  correo_institucional: string;
  nombre_completo: string;
  id_usuario: number;
};

export type DemoLoginResponse = {
  user: {
    id: number;
    email: string;
    name: string;
    roleCode: string;
    roleName: string;
  };
  mode: "demo";
};

export type HealthResponse = {
  status: string;
  database?: string;
  message?: string;
};

export function fetchHealth() {
  return apiJson<HealthResponse>("/api/health");
}

export function fetchDemoRoles() {
  return apiJson<DemoRoleRow[]>("/api/demo/roles");
}

export function postDemoLogin(email: string, password: string, roleCode: string) {
  return apiJson<DemoLoginResponse>("/api/demo/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, roleCode }),
  });
}
