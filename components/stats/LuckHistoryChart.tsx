"use client";

import { useEffect, useState } from "react";
import { StatisticsEmitter } from "@/app/game/shared/StatisticsEmitter";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";

const chartConfig = {
	luck: {
		label: "Sorte",
		color: "#ffff00",
	},
	cumulative: {
		label: "Sorte Acumulada",
		color: "#00aa00",
	},
} satisfies import("@/components/ui/chart").ChartConfig;

export function LuckHistoryChart() {
	const [luckHistory, setLuckHistory] = useState<number[]>([]);
	const [luckFactor, setLuckFactor] = useState<number>(0);

	useEffect(() => {
		const emitter = StatisticsEmitter.getInstance();
		const handleUpdate = (data: { luckHistory: number[]; luckFactor: number }) => {
			setLuckHistory([...data.luckHistory]);
			setLuckFactor(data.luckFactor);
		};

		emitter.on("luck", handleUpdate);

		return () => {
			emitter.off("luck", handleUpdate);
		};
	}, []);

	let cumulative = 0;
	const chartData = luckHistory.map((luck, index) => {
		cumulative += luck;
		return {
			hand: index + 1,
			luck: Number((luck * 100).toFixed(1)),
			cumulative: Number((cumulative * 100).toFixed(1)),
		};
	});

	const averageLuck = luckHistory.length > 0 ? luckFactor / luckHistory.length : 0;

	return (
		<div className="w-full space-y-2 bg-[#0a4a1f] rounded-lg border-2 border-[#00aa00] p-3 shadow-lg">
			<h3 className="text-xs font-bold text-white drop-shadow-[0_0_3px_rgba(0,170,0,0.8)] uppercase tracking-wide">🍀 Histórico de Sorte</h3>
			<ChartContainer config={chartConfig} className="h-[140px]">
				<LineChart
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
					<YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "600" }} tickFormatter={(value) => `${value}%`} />
					<ReferenceLine y={0} stroke="#ffffff" strokeDasharray="2 2" opacity={0.5} />
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const data = payload[0];
							return (
								<ChartTooltipContent className="bg-[#0a4a1f] border-2 border-[#00aa00] shadow-lg">
									<div className="flex flex-col gap-1">
										<span className="text-white text-xs font-bold">
											Mão {data.payload.hand}: {data.value}%
										</span>
										<span className="text-white text-[10px] opacity-90">Acumulado: {data.payload.cumulative}%</span>
									</div>
								</ChartTooltipContent>
							);
						}}
					/>
					<Line
						type="monotone"
						dataKey="luck"
						stroke="#ffff00"
						strokeWidth={3}
						dot={{ r: 4, fill: "#ffff00", strokeWidth: 2, stroke: "#ffffff" }}
						activeDot={{ r: 6, fill: "#ffaa00", strokeWidth: 2, stroke: "#ffffff" }}
					/>
				</LineChart>
			</ChartContainer>
			<div className="text-center text-[10px] space-y-1">
				<div className="text-white font-bold bg-[#0a4a1f] rounded px-2 py-1 border border-[#00aa00]">Sorte Média: {(averageLuck * 100).toFixed(1)}%</div>
				<div className="text-white text-[9px] opacity-80">{averageLuck > 0 ? "Sorte positiva" : averageLuck < 0 ? "Sorte negativa" : "Neutro"}</div>
			</div>
		</div>
	);
}
