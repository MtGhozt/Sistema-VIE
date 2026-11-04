-- Repara expedientes sembrados que ya estaban en el Comité pero quedaron sin
-- evaluadores porque el seed es anterior a comite_miembro (migración 005).
-- Solo asigna cuando la escuela tiene al menos tres evaluadores activos, igual
-- que assignCommittee; no crea cuentas, no toca comités ya asignados y respeta
-- el orden de id_usuario usado al enviar un expediente al cuerpo evaluador.
WITH elegibles AS (
  SELECT
    p.id_propuesta,
    u.id_usuario,
    ROW_NUMBER() OVER (PARTITION BY p.id_propuesta ORDER BY u.id_usuario) AS orden
  FROM propuesta p
  JOIN usuario u ON u.id_escuela = p.id_escuela AND u.activo = true
  JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
  JOIN rol r ON r.id_rol = ur.id_rol AND r.codigo = 'comite_evaluador'
  WHERE p.etapa_flujo = 2
    AND p.estado_actual IN ('en_evaluacion', 'dictaminada')
    AND NOT EXISTS (
      SELECT 1 FROM comite_miembro cm WHERE cm.id_propuesta = p.id_propuesta
    )
)
INSERT INTO comite_miembro (id_propuesta, id_usuario)
SELECT e.id_propuesta, e.id_usuario
FROM elegibles e
WHERE e.orden <= 3
  AND (SELECT count(*) FROM elegibles x WHERE x.id_propuesta = e.id_propuesta) >= 3
ON CONFLICT DO NOTHING;
