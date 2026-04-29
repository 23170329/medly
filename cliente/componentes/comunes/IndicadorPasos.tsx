import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { paleta } from "../../constants/theme";

interface Props {
  total: number;
  actual: number;
}

export function IndicadorPasos({ total, actual }: Props) {
  return (
    <View style={estilos.fila}>
      {Array.from({ length: total }, (_, i) => {
        const paso = i + 1;
        const activo = paso === actual;
        const pasado = paso < actual;
        return (
          <View key={paso} style={estilos.itemFila}>
            <View
              style={[
                estilos.pastilla,
                activo && estilos.activa,
                pasado && estilos.pasada,
              ]}
            >
              <Text
                style={[estilos.num, (activo || pasado) && estilos.numActivo]}
              >
                {pasado ? "✓" : paso}
              </Text>
            </View>
            {paso < total && (
              <View style={[estilos.linea, pasado && estilos.lineaPasada]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  itemFila: { flexDirection: "row", alignItems: "center" },
  pastilla: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8DFD0",
    alignItems: "center",
    justifyContent: "center",
  },
  activa: { backgroundColor: paleta.navy },
  pasada: { backgroundColor: paleta.teal },
  num: { fontSize: 13, fontWeight: "600", color: paleta.navy },
  numActivo: { color: "#FFFFFF" },
  linea: {
    width: 28,
    height: 2,
    backgroundColor: "#E8DFD0",
    marginHorizontal: 4,
  },
  lineaPasada: { backgroundColor: paleta.teal },
});
