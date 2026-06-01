# Checklist de implementación UX/UI — Correcciones (02/06/2026)

- Archivos auditados:
  - frontend/app/index.tsx
  - frontend/app/calculadora.tsx
  - frontend/src/Container.tsx
  - frontend/src/theme.ts
  - frontend/src/responsive.ts

- Problemas detectados y verificados en código:
  - `LEX HONDURAS` se solapaba con elementos del hero (overlay / spacing insuficiente).
  - Iconos en "Acciones principales" podían pisar el texto por uso de `gap` no consistente.
  - Stepper en la calculadora ocupaba demasiada altura y reduc&iacute;a espacio operativo.
  - Botones "Atrás" / "Continuar" demasiado grandes y desproporcionados.
  - Barra de búsqueda con padding excesivo y poco espacio útil.
  - Uso de `gap` en estilos (posible incompatibilidad RN Web) y `scale/fontScale` con diferencias entre SSR y hook.

- Cambios aplicados (mínimos, reversibles y focalizados):
  - Hero: `heroOverlay` marcado con `pointerEvents="none"` y `zIndex: 0`; `heroContent` con `zIndex:1`.
  - Brand: `brandIcon` marginRight y `brandTitle` `numberOfLines=1` + `flexShrink:1` para evitar solapes.
  - Acciones principales: eliminados `gap` en el contenedor principal y se usan márgenes explícitos en los iconos.
  - Stepper: reducido `stepCircle` (26→22), `stepItem` minWidth (48→40) y etiquetas más compactas.
  - Búsqueda: menor `paddingHorizontal`/`paddingVertical` y márgenes explícitos en los iconos.
  - Botones footer: reducción de `paddingVertical`, `btnPrimary` pasó a `flex:1` (antes `2`) y `minHeight` consistente.
  - Se añadieron comentarios y cambios mínimos de estilo para evitar `gap` donde importa.

- Validaciones ejecutadas:
  - Intento de ejecutar `yarn lint` en `frontend/` — NO VALIDADO: el comando `yarn` no est&aacute; disponible en el entorno (shell devolvió "yarn: The term 'yarn' is not recognized").

- Pendientes / Recomendado (próximo paso):
  - Ejecutar `yarn install` y `yarn lint` localmente / en CI para validar lint y corregir warnings.
  - Abrir vista previa web (`expo start --web` o `yarn web`) y revisar visualmente en mobile/tablet/desktop.
  - Buscar y eliminar otras ocurrencias de `gap` y sustituirlas por márgenes explícitos si ocasionan problemas en RN Web.
  - Añadir atributos de accesibilidad (`accessibilityLabel`, foco, roles) donde aplique.


