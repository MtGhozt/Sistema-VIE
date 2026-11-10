/** Formato monetario CRC para presupuestos (wizard y CaseFile). */
export function formatCRC(amount: number) {
  return `₡${new Intl.NumberFormat("es-CR").format(amount)}`;
}

export function formatCRCFromParts(operativo: number, duraderos: number) {
  return formatCRC(operativo + duraderos);
}
