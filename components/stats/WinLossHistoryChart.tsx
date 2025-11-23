"use client";

import { useEffect, useState } from "react";
import { StatisticsEmitter } from "@/app/game/shared/StatisticsEmitter";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

const chartConfig = {
	result: {
		label: "Resultado",
		color: "#00aa00",
	},
} satisfies import("@/components/ui/chart").ChartConfig;

export function WinLossHistoryChart() {
	const [winLossHistory, setWinLossHistory] = useState<(number | null)[]>([]);

	useEffect(() => {
		const emitter = StatisticsEmitter.getInstance();
		const handleUpdate = (data: { winLossHistory: (number | null)[] }) => {
			setWinLossHistory([...data.winLossHistory]);
		};

		emitter.on("winLossHistory", handleUpdate);

		return () => {
			emitter.off("winLossHistory", handleUpdate);
		};
	}, []);

	const chartData = winLossHistory.map((result, index) => {
		let value = 0;
		let color = "#666666";
		if (result === 1) {
			value = 1;
			color = "#00aa00";
		} else if (result === 0) {
			value = -1;
			color = "#aa0000";
		}

		return {
			hand: index + 1,
			handLabel: `Mão ${index + 1}`,
			result: value,
			color,
		};
	});

	const wins = winLossHistory.filter((r) => r === 1).length;
	const losses = winLossHistory.filter((r) => r === 0).length;
	const ties = winLossHistory.filter((r) => r === null).length;
	const total = winLossHistory.length;
	const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";

	return (
		<div className="w-full space-y-2 bg-[#0a4a1f] rounded-lg border-2 border-[#00aa00] p-3 shadow-lg">
			<h3 className="text-xs font-bold text-white drop-shadow-[0_0_3px_rgba(0,170,0,0.8)] uppercase tracking-wide">
				🎲 Histórico de Vitórias/Derrotas
			</h3>
			<ChartContainer config={chartConfig} className="h-[140px]">
				<BarChart
					data={chartData}
					margin={{
						top: 5,
						right: 10,
						left: 10,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#00aa00" opacity={0.2} />
					<XAxis
						dataKey="hand"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "600" }}
						label={{ value: "Mão", position: "insideBottom", offset: -5, style: { fill: "#ffffff", fontSize: "10px", fontWeight: "bold" } }}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						domain={[-1.2, 1.2]}
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "600" }}
						tickFormatter={(value) => {
							if (value === 1) return "Vitória";
							if (value === -1) return "Derrota";
							return "";
						}}
					/>
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const data = payload[0];
							const result = data.payload.result;
							let label = "Empate";
							if (result === 1) label = "Vitória";
							else if (result === -1) label = "Derrota";
							return (
								<ChartTooltipContent className="bg-[#0a4a1f] border-2 border-[#00aa00] shadow-lg">
									<div className="flex items-center gap-2">
										<span className="text-white text-xs font-bold">
											{data.payload.handLabel}: {label}
										</span>
									</div>
								</ChartTooltipContent>
							);
						}}
					/>
					<Bar
						dataKey="result"
						radius={[4, 4, 0, 0]}
					>
						{chartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
						))}
					</Bar>
				</BarChart>
			</ChartContainer>
			<div className="text-center text-[10px] space-y-1">
				<div className="text-white font-bold bg-[#0a4a1f] rounded px-2 py-1 border border-[#00aa00]">
					Taxa de Vitória: {winRate}%
				</div>
				<div className="text-white text-[9px] opacity-80">
					V: {wins} | D: {losses} | E: {ties} | Total: {total}
				</div>
			</div>
		</div>
	);
}
