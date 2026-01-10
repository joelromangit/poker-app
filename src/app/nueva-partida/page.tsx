"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import NumberInput from "@/components/NumberInput";
import { createGameDraft } from "@/lib/games";
import { getPlayers, createPlayer, getAvatarColor } from "@/lib/players";
import { Player } from "@/types";
import {
	Plus,
	Euro,
	Users,
	Calculator,
	ChevronDown,
	X,
	Check,
	Loader2,
	UserPlus,
	Calendar,
	Trophy,
	Banknote,
	Lock,
	Settings2,
	AlertCircle,
	ArrowRight,
} from "lucide-react";

// Game mode types
type GameMode = "cash" | "tournament";

// Cash game format types
type CashGameFormat = "entry5" | "entry10" | "custom";

// Predefined cash game formats (100BB with easy-to-manage chip values)
const CASH_GAME_FORMATS = {
	entry5: {
		name: "5€ Entry",
		description: "100BB - SB 5, BB 10",
		chipValue: 0.005, // 5€ / 1000 chips
		buyIn: 1000,
		totalEntry: 5,
	},
	entry10: {
		name: "10€ Entry",
		description: "100BB - SB 5, BB 10",
		chipValue: 0.01, // 10€ / 1000 chips
		buyIn: 1000,
		totalEntry: 10,
	},
	custom: {
		name: "Personalizado",
		description: "Configura tus propios valores",
		chipValue: 0.01,
		buyIn: 1000,
		totalEntry: 10,
	},
};

// Simple player selection type (no chips data needed)
interface SelectedPlayer {
	player_id: string;
	player: Player;
}

export default function NuevaPartidaPage() {
	const router = useRouter();
	const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
	const [loadingPlayers, setLoadingPlayers] = useState(true);

	const [gameName, setGameName] = useState("");
	const [chipValue, setChipValue] = useState("0.005");
	const [buyIn, setBuyIn] = useState("1000");
	const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	// Fecha y hora de la partida
	const [gameDate, setGameDate] = useState("");
	const [gameTime, setGameTime] = useState("");

	// Game mode and format
	const [gameMode, setGameMode] = useState<GameMode>("cash");
	const [cashGameFormat, setCashGameFormat] =
		useState<CashGameFormat>("entry5");

	// Modal para nuevo jugador
	const [showNewPlayerModal, setShowNewPlayerModal] = useState(false);
	const [newPlayerName, setNewPlayerName] = useState("");
	const [creatingPlayer, setCreatingPlayer] = useState(false);

	// Dropdown de selección
	const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

	// Cargar jugadores
	useEffect(() => {
		loadPlayers();
	}, []);

	const loadPlayers = async () => {
		setLoadingPlayers(true);
		const players = await getPlayers();
		setAvailablePlayers(players);
		setLoadingPlayers(false);

		// Establecer fecha y hora actual por defecto
		const now = new Date();
		const currentDate = now.toISOString().split("T")[0];
		const currentTime = now.toTimeString().slice(0, 5);
		setGameDate(currentDate);
		setGameTime(currentTime);

		// Set default format values
		const defaultFormat = CASH_GAME_FORMATS.entry5;
		setChipValue(defaultFormat.chipValue.toString());
		setBuyIn(defaultFormat.buyIn.toString());
	};

	// Handle cash game format change
	const handleFormatChange = (format: CashGameFormat) => {
		setCashGameFormat(format);
		if (format !== "custom") {
			const formatConfig = CASH_GAME_FORMATS[format];
			setChipValue(formatConfig.chipValue.toString());
			setBuyIn(formatConfig.buyIn.toString());
		}
	};

	// Calculate total entry for custom mode
	const calculateCustomEntry = (): number => {
		const chips = parseFloat(buyIn) || 0;
		const value = parseFloat(chipValue) || 0;
		return chips * value;
	};

	// Añadir jugador a la partida
	const addPlayerToGame = (player: Player) => {
		if (!selectedPlayers.some((sp) => sp.player_id === player.id)) {
			setSelectedPlayers([
				...selectedPlayers,
				{
					player_id: player.id,
					player: player,
				},
			]);
		}
	};

	// Toggle jugador (añadir o quitar)
	const togglePlayerInGame = (player: Player) => {
		const isSelected = selectedPlayers.some((sp) => sp.player_id === player.id);
		if (isSelected) {
			removePlayerFromGame(player.id);
		} else {
			addPlayerToGame(player);
		}
	};

	// Eliminar jugador de la partida
	const removePlayerFromGame = (playerId: string) => {
		setSelectedPlayers(selectedPlayers.filter((p) => p.player_id !== playerId));
	};

	// Crear nuevo jugador
	const handleCreatePlayer = async () => {
		if (!newPlayerName.trim()) return;

		setCreatingPlayer(true);
		const player = await createPlayer({ name: newPlayerName.trim() });

		if (player) {
			setAvailablePlayers((prev) =>
				[...prev, player].sort((a, b) => a.name.localeCompare(b.name)),
			);
			addPlayerToGame(player);
			setNewPlayerName("");
			setShowNewPlayerModal(false);
		}

		setCreatingPlayer(false);
	};

	// Verificar si se puede crear la partida
	const canCreate = selectedPlayers.length >= 2;

	// Crear partida
	const handleSubmit = async () => {
		setError("");

		if (selectedPlayers.length < 2) {
			setError("Necesitas al menos 2 jugadores");
			return;
		}

		setSaving(true);

		try {
			// Crear fecha combinando fecha y hora
			const gameDatetime = new Date(`${gameDate}T${gameTime}:00`);

			const gameId = await createGameDraft(
				parseFloat(chipValue) || 0,
				parseFloat(buyIn) || 0,
				selectedPlayers.map((p) => p.player_id),
				notes.trim() || undefined,
				gameDatetime,
				gameName.trim() || undefined,
			);

			if (gameId) {
				router.push(`/editar-partida/${gameId}`);
			} else {
				setError("Error al crear la partida. Verifica la conexión.");
				setSaving(false);
			}
		} catch (err) {
			console.error("Error creating game:", err);
			setError("Error al crear la partida.");
			setSaving(false);
		}
	};

	return (
		<>
			<Header />

			<main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
				<div className="animate-fade-in w-full">
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
						Nueva Partida
					</h1>
					<p className="text-foreground-muted mb-6">
						Configura los valores y selecciona a los jugadores
					</p>

					{/* Nombre y fecha de la partida */}
					<section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
						<h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
							<Calendar className="w-5 h-5 text-primary" />
							Información de la Partida
						</h2>

						{/* Nombre de la partida */}
						<div className="mb-4">
							<label className="block text-sm text-foreground-muted mb-2">
								Nombre de la partida (opcional)
							</label>
							<input
								type="text"
								value={gameName}
								onChange={(e) => setGameName(e.target.value)}
								className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
								placeholder="Ej: Andorra 2022, Nochevieja..."
							/>
						</div>

						<div className="grid sm:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm text-foreground-muted mb-2">
									Fecha de la partida
								</label>
								<input
									type="date"
									value={gameDate}
									onChange={(e) => setGameDate(e.target.value)}
									className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none min-w-0 box-border"
								/>
							</div>

							<div>
								<label className="block text-sm text-foreground-muted mb-2">
									Hora de la partida
								</label>
								<input
									type="time"
									value={gameTime}
									onChange={(e) => setGameTime(e.target.value)}
									className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none min-w-0 box-border"
								/>
							</div>
						</div>
					</section>

					{/* Game Mode Selection */}
					<section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
						<h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
							<Settings2 className="w-5 h-5 text-primary" />
							Modo de Juego
						</h2>

						{/* Mode Selection */}
						<div className="grid grid-cols-2 gap-3 mb-6">
							{/* Cash Game - Active */}
							<button
								type="button"
								onClick={() => setGameMode("cash")}
								className={`p-4 rounded-xl border-2 transition-all text-left ${
									gameMode === "cash"
										? "border-primary bg-primary/10"
										: "border-border hover:border-primary/50"
								}`}
							>
								<div className="flex items-center gap-2 mb-1">
									<Banknote
										className={`w-5 h-5 ${gameMode === "cash" ? "text-primary" : "text-foreground-muted"}`}
									/>
									<span
										className={`font-semibold ${gameMode === "cash" ? "text-foreground" : "text-foreground-muted"}`}
									>
										Cash Game
									</span>
								</div>
								<p className="text-xs text-foreground-muted">
									Partida con dinero real
								</p>
							</button>

							{/* Tournament - Disabled */}
							<button
								type="button"
								disabled
								className="p-4 rounded-xl border-2 border-border bg-background-secondary/50 text-left opacity-60 cursor-not-allowed"
							>
								<div className="flex items-center gap-2 mb-1">
									<Trophy className="w-5 h-5 text-foreground-muted" />
									<span className="font-semibold text-foreground-muted">
										Torneo
									</span>
									<Lock className="w-3 h-3 text-foreground-muted" />
								</div>
								<p className="text-xs text-foreground-muted">Proximamente</p>
							</button>
						</div>

						{/* Cash Game Format Selection */}
						{gameMode === "cash" && (
							<>
								<h3 className="text-sm font-medium text-foreground mb-3">
									Formato de entrada
								</h3>
								<div className="flex gap-2 mb-4">
									{/* 5€ Entry */}
									<button
										type="button"
										onClick={() => handleFormatChange("entry5")}
										className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
											cashGameFormat === "entry5"
												? "border-accent bg-accent/10"
												: "border-border hover:border-accent/50"
										}`}
									>
										<span
											className={`font-bold text-lg ${cashGameFormat === "entry5" ? "text-accent" : "text-foreground"}`}
										>
											5€
										</span>
										<p className="text-xs text-foreground-muted mt-0.5">
											100BB
										</p>
									</button>

									{/* 10€ Entry */}
									<button
										type="button"
										onClick={() => handleFormatChange("entry10")}
										className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
											cashGameFormat === "entry10"
												? "border-accent bg-accent/10"
												: "border-border hover:border-accent/50"
										}`}
									>
										<span
											className={`font-bold text-lg ${cashGameFormat === "entry10" ? "text-accent" : "text-foreground"}`}
										>
											10€
										</span>
										<p className="text-xs text-foreground-muted mt-0.5">
											100BB
										</p>
									</button>

									{/* Custom */}
									<button
										type="button"
										onClick={() => handleFormatChange("custom")}
										className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
											cashGameFormat === "custom"
												? "border-accent bg-accent/10"
												: "border-border hover:border-accent/50"
										}`}
									>
										<span
											className={`font-bold text-lg ${cashGameFormat === "custom" ? "text-accent" : "text-foreground"}`}
										>
											Custom
										</span>
										<p className="text-xs text-foreground-muted mt-0.5">
											Configura
										</p>
									</button>
								</div>

								{/* Format Info or Custom Fields */}
								{cashGameFormat !== "custom" ? (
									<div className="p-4 bg-background rounded-xl border border-border">
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm text-foreground-muted">
												Entry:
											</span>
											<span className="font-bold text-accent">
												{CASH_GAME_FORMATS[cashGameFormat].totalEntry}€
											</span>
										</div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm text-foreground-muted">
												Fichas:
											</span>
											<span className="font-medium text-foreground">
												{CASH_GAME_FORMATS[cashGameFormat].buyIn}
											</span>
										</div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm text-foreground-muted">
												Valor ficha:
											</span>
											<span className="font-medium text-foreground">
												{CASH_GAME_FORMATS[cashGameFormat].chipValue}€
											</span>
										</div>
										<div className="text-xs text-foreground-muted pt-2 border-t border-border">
											Small Blind: 5 fichas | Big Blind: 10 fichas
										</div>
									</div>
								) : (
									<div className="p-4 bg-background rounded-xl border border-border">
										<div className="grid sm:grid-cols-2 gap-4 mb-4">
											<div>
												<label className="block text-sm text-foreground-muted mb-2">
													Valor de cada ficha (€)
												</label>
												<NumberInput
													value={chipValue}
													onChange={setChipValue}
													step={0.001}
													min={0.001}
													placeholder="0.01"
													icon={<Euro className="w-4 h-4" />}
												/>
											</div>

											<div>
												<label className="block text-sm text-foreground-muted mb-2">
													Fichas por buy-in
												</label>
												<NumberInput
													value={buyIn}
													onChange={setBuyIn}
													step={100}
													min={1}
													placeholder="1000"
													icon={<Calculator className="w-4 h-4" />}
												/>
											</div>
										</div>

										{/* Dynamic Total Calculation */}
										<div className="pt-3 border-t border-border">
											<div className="flex items-center justify-between">
												<span className="text-sm text-foreground-muted">
													Entry total calculado:
												</span>
												<span className="font-bold text-lg text-accent">
													{calculateCustomEntry().toFixed(2)}€
												</span>
											</div>
										</div>
									</div>
								)}
							</>
						)}
					</section>

					{/* Jugadores */}
					<section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
								<Users className="w-5 h-5 text-primary" />
								Jugadores ({selectedPlayers.length})
							</h2>
						</div>

						{/* Selector de jugadores - Multiselección */}
						<div className="relative mb-4">
							<button
								type="button"
								onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
								disabled={loadingPlayers}
								className="w-full px-4 py-3 rounded-xl bg-background border border-border text-left flex items-center justify-between hover:border-primary/50 transition-colors"
							>
								<span className="text-foreground-muted flex items-center gap-2">
									<Plus className="w-4 h-4" />
									Seleccionar jugadores...
								</span>
								<ChevronDown
									className={`w-5 h-5 text-foreground-muted transition-transform ${showPlayerDropdown ? "rotate-180" : ""}`}
								/>
							</button>

							{showPlayerDropdown && (
								<>
									{/* Overlay para cerrar al hacer clic fuera */}
									<div
										className="fixed inset-0 z-[5]"
										onClick={() => setShowPlayerDropdown(false)}
									/>

									<div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-border rounded-xl shadow-lg z-10 max-h-72 overflow-y-auto">
										{/* Header del dropdown */}
										<div className="sticky top-0 bg-background-card border-b border-border p-3 flex items-center justify-between">
											<span className="text-sm text-foreground-muted">
												{selectedPlayers.length} seleccionados
											</span>
											<button
												type="button"
												onClick={() => setShowPlayerDropdown(false)}
												className="text-xs text-primary font-medium hover:underline"
											>
												Listo
											</button>
										</div>

										{availablePlayers.length === 0 ? (
											<div className="p-4 text-center text-foreground-muted">
												No hay jugadores registrados
											</div>
										) : (
											availablePlayers.map((player) => {
												const isSelected = selectedPlayers.some(
													(sp) => sp.player_id === player.id,
												);
												return (
													<button
														key={player.id}
														type="button"
														onClick={() => togglePlayerInGame(player)}
														className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
															isSelected
																? "bg-primary/10 hover:bg-primary/20"
																: "hover:bg-background"
														}`}
													>
														{/* Checkbox visual */}
														<div
															className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
																isSelected
																	? "bg-primary border-primary"
																	: "border-border"
															}`}
														>
															{isSelected && (
																<Check className="w-3 h-3 text-white" />
															)}
														</div>

														{player.avatar_url ? (
															<img
																src={player.avatar_url}
																alt={player.name}
																className="w-8 h-8 rounded-full object-cover"
															/>
														) : (
															<div
																className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
																style={{
																	backgroundColor: getAvatarColor(
																		player.avatar_color,
																	),
																}}
															>
																{player.name.charAt(0).toUpperCase()}
															</div>
														)}
														<span
															className={`flex-1 ${isSelected ? "text-foreground font-medium" : "text-foreground"}`}
														>
															{player.name}
														</span>
													</button>
												);
											})
										)}

										{/* Crear nuevo jugador */}
										<button
											type="button"
											onClick={() => {
												setShowPlayerDropdown(false);
												setShowNewPlayerModal(true);
											}}
											className="w-full px-4 py-3 text-left hover:bg-background flex items-center gap-3 transition-colors border-t border-border text-primary"
										>
											<div className="w-5 h-5" /> {/* Spacer para alineación */}
											<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
												<UserPlus className="w-4 h-4" />
											</div>
											<span className="font-medium">Crear nuevo jugador</span>
										</button>
									</div>
								</>
							)}
						</div>

						{/* Lista de jugadores seleccionados */}
						{selectedPlayers.length === 0 ? (
							<div className="text-center py-8 text-foreground-muted">
								<Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
								<p>Selecciona al menos 2 jugadores para empezar</p>
							</div>
						) : (
							<div className="space-y-2">
								{selectedPlayers.map((sp) => (
									<div
										key={sp.player_id}
										className="bg-background rounded-xl p-3 border border-border flex items-center gap-3"
									>
										{/* Avatar */}
										{sp.player?.avatar_url ? (
											<img
												src={sp.player.avatar_url}
												alt={sp.player.name || ""}
												className="w-10 h-10 rounded-full object-cover flex-shrink-0"
											/>
										) : (
											<div
												className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
												style={{
													backgroundColor: getAvatarColor(
														sp.player?.avatar_color,
													),
												}}
											>
												{sp.player?.name?.charAt(0).toUpperCase() || "?"}
											</div>
										)}

										{/* Nombre */}
										<p className="flex-1 font-medium text-foreground truncate">
											{sp.player?.name || "Jugador desconocido"}
										</p>

										{/* Botón eliminar */}
										<button
											type="button"
											onClick={() => removePlayerFromGame(sp.player_id)}
											className="p-2 text-foreground-muted hover:text-danger transition-colors"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								))}
							</div>
						)}
					</section>

					{/* Notas */}
					<section className="bg-background-card rounded-2xl p-5 sm:p-6 border border-border mb-6">
						<h2 className="text-lg font-semibold text-foreground mb-4">
							Notas (opcional)
						</h2>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground resize-none"
							rows={3}
							placeholder="Añade notas sobre la partida..."
						/>
					</section>

					{/* Error message */}
					{error && (
						<div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger flex items-center gap-2">
							<AlertCircle className="w-5 h-5 flex-shrink-0" />
							<span>{error}</span>
						</div>
					)}

					{/* Botón crear */}
					<button
						type="button"
						onClick={handleSubmit}
						disabled={saving || !canCreate}
						className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
							saving || !canCreate
								? "bg-border text-foreground-muted cursor-not-allowed"
								: "btn-accent"
						}`}
					>
						{saving ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Creando...
							</>
						) : (
							<>
								Crear Partida
								<ArrowRight className="w-5 h-5" />
							</>
						)}
					</button>

					{/* Info text */}
					<p className="text-center text-sm text-foreground-muted mt-4">
						Después de crear la partida podrás añadir los resultados finales
					</p>
				</div>
			</main>

			{/* Modal crear nuevo jugador */}
			{showNewPlayerModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-background-card rounded-2xl p-6 w-full max-w-md border border-border animate-slide-in">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold text-foreground">
								Nuevo Jugador
							</h2>
							<button
								onClick={() => {
									setShowNewPlayerModal(false);
									setNewPlayerName("");
								}}
								className="p-2 text-foreground-muted hover:text-foreground transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="mb-4">
							<label className="block text-sm text-foreground-muted mb-2">
								Nombre del jugador
							</label>
							<input
								type="text"
								value={newPlayerName}
								onChange={(e) => setNewPlayerName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleCreatePlayer()}
								className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
								placeholder="Ej: Carlos"
								autoFocus
							/>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => {
									setShowNewPlayerModal(false);
									setNewPlayerName("");
								}}
								className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground-muted hover:bg-background transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={handleCreatePlayer}
								disabled={creatingPlayer || !newPlayerName.trim()}
								className="flex-1 btn-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
							>
								{creatingPlayer ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<>
										<Check className="w-5 h-5" />
										Crear y añadir
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
