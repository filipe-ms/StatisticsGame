"use client";

import { useEffect, useState } from "react";
import { StatisticsEmitter } from "@/app/game/shared/StatisticsEmitter";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const chartConfig = {
	winChance: {
		label: "Chance de Vencer",
		color: "#00aa00",
	},
	bustRisk: {
		label: "Risco de Bust",
		color: "#aa0000",
	},
	perfectPlay: {
		label: "Jogadas Perfeitas",
		color: "#ffff00",
	},
} satisfies import("@/components/ui/chart").ChartConfig;

export function CurrentStateRadarChart() {
	const [winChance, setWinChance] = useState<number>(0);
	const [bustProbability, setBustProbability] = useState<number>(0);
	const [perfectPlayPercent, setPerfectPlayPercent] = useState<number>(0);

	useEffect(() => {
		const emitter = StatisticsEmitter.getInstance();

		const handleWinChance = (data: { winChance: number }) => {
			setWinChance(data.winChance);
		};

		const handleBustProbability = (data: { bustProbability: number }) => {
			setBustProbability(data.bustProbability);
		};

		const handlePerfectPlay = (data: {
			perfectPlayPercent: number;
			totalDecisions: number;
		}) => {
			setPerfectPlayPercent(data.perfectPlayPercent);
		};

		emitter.on("winChance", handleWinChance);
		emitter.on("bustProbability", handleBustProbability);
		emitter.on("perfectPlay", handlePerfectPlay);

		return () => {
			emitter.off("winChance", handleWinChance);
			emitter.off("bustProbability", handleBustProbability);
			emitter.off("perfectPlay", handlePerfectPlay);
		};
	}, []);

	const safety = (1 - bustProbability) * 100;
	const winPercent = winChance * 100;
	const perfectPercent = perfectPlayPercent * 100;

	const data = [
		{
			metric: "Chance\nVencer",
			value: winPercent,
			fullMark: 100,
		},
		{
			metric: "Segurança",
			value: safety,
			fullMark: 100,
		},
		{
			metric: "Jogadas\nPerfeitas",
			value: perfectPercent,
			fullMark: 100,
		},
	];

	return (
		<div className="w-full space-y-2 bg-[#0a4a1f] rounded-lg border-2 border-[#00aa00] p-3 shadow-lg">
			<h3 className="text-xs font-bold text-white drop-shadow-[0_0_3px_rgba(0,170,0,0.8)] uppercase tracking-wide">
				🃏 Estado Atual (Radar)
			</h3>
			<ChartContainer config={chartConfig} className="h-[160px]">
				<RadarChart data={data}>
					<PolarGrid stroke="#00aa00" strokeWidth={1} opacity={0.4} />
					<PolarAngleAxis
						dataKey="metric"
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "bold" }}
					/>
					<PolarRadiusAxis
						angle={90}
						domain={[0, 100]}
						tick={{ fill: "#ffffff", fontSize: 10, fontWeight: "600" }}
						tickFormatter={(value) => `${value}%`}
						axisLine={false}
					/>
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const data = payload[0];
							return (
								<ChartTooltipContent className="bg-[#0a4a1f] border-2 border-[#00aa00] shadow-lg">
									<div className="flex items-center gap-2">
										<span className="text-white text-xs font-bold">
											{data.payload.metric}: {data.value?.toFixed(1)}%
										</span>
									</div>
								</ChartTooltipContent>
							);
						}}
					/>
					<Radar
						name="Estado"
						dataKey="value"
						stroke="#ffff00"
						fill="#ffff00"
						fillOpacity={0.5}
						strokeWidth={3}
					/>
				</RadarChart>
			</ChartContainer>
			<div className="text-center text-[9px] space-y-1">
				<div className="text-white font-bold bg-[#0a4a1f] rounded px-2 py-1 border border-[#00aa00]">
					Vencer: {winPercent.toFixed(1)}% | Seguro: {safety.toFixed(1)}% | Perfeito: {perfectPercent.toFixed(1)}%
				</div>
			</div>
		</div>
	);
}
