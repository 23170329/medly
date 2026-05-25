import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES, paleta, BORDES } from "../../constants/theme";

interface Props {
  readonly nombreMedico: string;
  readonly enviando: boolean;
  readonly onEnviar: (estrellas: number, comentario?: string) => void;
}

export function FormularioCalificacionMedico({
  nombreMedico,
  enviando,
  onEnviar,
}: Props): React.JSX.Element {
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>¿Cómo fue tu consulta?</Text>
      <Text style={estilos.subtitulo}>
        Califica a {nombreMedico} de 1 a 5 estrellas
      </Text>

      <View style={estilos.estrellas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setEstrellas(n)}
            accessibilityRole="button"
            accessibilityLabel={`${n} estrellas`}
          >
            <Ionicons
              name={n <= estrellas ? "star" : "star-outline"}
              size={40}
              color={n <= estrellas ? "#F5B301" : paleta.skyblue}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={estilos.label}>Comentario (opcional)</Text>
      <TextInput
        style={estilos.input}
        value={comentario}
        onChangeText={setComentario}
        placeholder="Cuéntanos tu experiencia…"
        placeholderTextColor={COLORES.textoPlaceholder}
        multiline
        maxLength={500}
      />

      <TouchableOpacity
        style={[
          estilos.btn,
          (estrellas < 1 || enviando) && estilos.btnDisabled,
        ]}
        disabled={estrellas < 1 || enviando}
        onPress={() => onEnviar(estrellas, comentario.trim() || undefined)}
      >
        {enviando ? (
          <ActivityIndicator color={paleta.white} />
        ) : (
          <Text style={estilos.btnTxt}>ENVIAR CALIFICACIÓN</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: paleta.white,
    borderRadius: BORDES.radio,
    padding: 20,
    marginTop: 8,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "800",
    color: paleta.navy,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 14,
    color: paleta.teal,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  estrellas: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: paleta.teal,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: paleta.beige,
    borderRadius: BORDES.radio,
    borderWidth: 1,
    borderColor: paleta.skyblue,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
    color: paleta.navy,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: paleta.navy,
    borderRadius: BORDES.radioPill,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: {
    color: paleta.white,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
