import { StyleSheet, View } from "react-native";
import { TextInput, HelperText, type TextInputProps } from "react-native-paper";

interface Props extends Omit<TextInputProps, "error"> {
  error?: string;
  icono?: string;
}

export function Entrada({ error, icono, style, ...rest }: Props) {
  return (
    <View style={estilos.wrap}>
      <TextInput
        mode="outlined"
        left={icono ? <TextInput.Icon icon={icono} /> : undefined}
        error={!!error}
        style={[estilos.input, style]}
        outlineStyle={estilos.borde}
        {...rest}
      />
      {!!error && (
        <HelperText type="error" visible={!!error} style={estilos.helper}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  wrap: { marginVertical: 6 },
  input: { backgroundColor: "#FFFFFF" },
  borde: { borderRadius: 12 },
  helper: { marginTop: -4 },
});
