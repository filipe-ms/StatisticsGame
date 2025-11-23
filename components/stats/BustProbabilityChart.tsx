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
	bust: {
		label: "Chance de Bust",
		color: "#aa0000",
	},
} satisfies import("@/components/ui/chart").ChartConfig;

export function BustProbabilityChart() {
	const [bustProbability, setBustProbability] = useState<number>(0);

	useEffect(() => {
		const emitter = StatisticsEmitter.getInstance();
		const handleUpdate = (data: { bustProbability: number }) => {
			setBustProbability(data.bustProbability);
		};

		emitter.on("bustProbability", handleUpdate);

		return () => {
			emitter.off("bustProbability", handleUpdate);
		};
	}, []);

	const bustPercent = bustProbability * 100;
	const safePercent = (1 - bustProbability) * 100;

	const data = [
		{
			name: "Bust",
			value: bustPercent,
			fill: "#aa0000",
		},
		{
			name: "Seguro",
			value: safePercent,
			fill: "#00aa00",
		},
	];

	return (
		<div className="w-full space-y-2 bg-[#0a4a1f] rounded-lg border-2 border-[#00aa00] p-3 shadow-lg">
			<h3 className="text-xs font-bold text-white drop-shadow-[0_0_3px_rgba(0,170,0,0.8)] uppercase tracking-wide">
				⚠️ Chance de Bust no Próximo Draw
			</h3>
			<ChartContainer config={chartConfig} className="h-[140px]">
				<BarChart
					data={data}
					layout="vertical"
					margin={{
						top: 5,
						right: 10,
						left: 50,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#00aa00" opacity={0.2} />
					<XAxis
						type="number"
						domain={[0, 100]}
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "600" }}
						tickFormatter={(value) => `${value}%`}
					/>
					<YAxis
						type="category"
						dataKey="name"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						width={45}
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "bold" }}
					/>
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const data = payload[0];
							return (
								<ChartTooltipContent className="bg-[#0a4a1f] border-2 border-[#00aa00] shadow-lg">
									<div className="flex items-center gap-2">
										<span className="text-white text-xs font-bold">
											{data.payload.name}: {data.value?.toFixed(1)}%
										</span>
									</div>
								</ChartTooltipContent>
							);
						}}
					/>
					<Bar dataKey="value" radius={[0, 4, 4, 0]}>
						{data.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.fill} />
						))}
					</Bar>
				</BarChart>
			</ChartContainer>
			<div className="text-center text-[10px] text-white font-bold bg-[#0a4a1f] rounded px-2 py-1 border border-[#00aa00]">
				{bustPercent.toFixed(1)}% de chance de bust
			</div>
		</div>
	);
}
