import { StyleSheet } from "react-native";
import { Button, type ButtonProps } from "react-native-paper";

interface Props extends Omit<ButtonProps, "children"> {
  titulo: string;
  cargando?: boolean;
  variante?: "primario" | "secundario" | "texto";
}

export function Boton({
  titulo,
  cargando,
  variante = "primario",
  style,
  ...rest
}: Props) {
  const modeMap = {
    primario: "contained",
    secundario: "outlined",
    texto: "text",
  } as const;

  return (
    <Button
      mode={modeMap[variante]}
      loading={cargando}
      disabled={cargando}
      style={[estilos.base, style]}
      contentStyle={estilos.contenido}
      labelStyle={estilos.etiqueta}
      {...rest}
    >
      {titulo}
    </Button>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: 12, marginVertical: 6 },
  contenido: { height: 52 },
  etiqueta: { fontSize: 16, fontWeight: "600", letterSpacing: 0.3 },
});
