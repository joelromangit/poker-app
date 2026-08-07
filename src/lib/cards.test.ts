import { describe, expect, it } from "vitest";
import { formatCards, parseCards, rankLabel } from "./cards";

describe("parseCards", () => {
  it("parsea notación compacta", () => {
    expect(parseCards("AsKd")).toEqual(["As", "Kd"]);
    expect(parseCards("Th7c2h")).toEqual(["Th", "7c", "2h"]);
  });

  it("normaliza mayúsculas y minúsculas", () => {
    expect(parseCards("asKD")).toEqual(["As", "Kd"]);
  });

  it("devuelve vacío con entradas inválidas", () => {
    expect(parseCards(null)).toEqual([]);
    expect(parseCards(undefined)).toEqual([]);
    expect(parseCards("")).toEqual([]);
    expect(parseCards("A")).toEqual([]); // longitud impar
    expect(parseCards("Xx")).toEqual([]); // rango inválido
    expect(parseCards("Az")).toEqual([]); // palo inválido
  });

  it("hace ida y vuelta con formatCards", () => {
    expect(formatCards(parseCards("AhAd"))).toBe("AhAd");
  });
});

describe("rankLabel", () => {
  it("muestra el 10 como 10 y el resto tal cual", () => {
    expect(rankLabel("T")).toBe("10");
    expect(rankLabel("A")).toBe("A");
  });
});
