"use client";

import { useEffect, useState } from "react";
import { StatisticsEmitter } from "@/app/game/shared/StatisticsEmitter";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
	winChance: {
		label: "Chance de Vencer (%)",
		color: "hsl(var(--chart-1))",
	},
} satisfies import("@/components/ui/chart").ChartConfig;

export function WinChanceHistoryChart() {
	const [winChanceHistory, setWinChanceHistory] = useState<number[]>([]);

	useEffect(() => {
		const emitter = StatisticsEmitter.getInstance();
		const handleUpdate = (data: { winChanceHistory: number[] }) => {
			setWinChanceHistory([...data.winChanceHistory]);
		};

		emitter.on("winChanceHistory", handleUpdate);

		return () => {
			emitter.off("winChanceHistory", handleUpdate);
		};
	}, []);

	const chartData = winChanceHistory.map((chance, index) => ({
		hand: `Mão ${index + 1}`,
		winChance: chance * 100,
	}));

	return (
		<div className="w-full space-y-2">
			<h3 className="text-sm font-semibold text-foreground">
				Histórico de Chance de Vencer
			</h3>
			<ChartContainer config={chartConfig} className="h-[200px]">
				<LineChart
					data={chartData}
					margin={{
						top: 5,
						right: 10,
						left: 10,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
					<XAxis
						dataKey="hand"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						angle={-45}
						textAnchor="end"
						height={60}
						className="text-xs"
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						domain={[0, 100]}
						className="text-xs"
						tickFormatter={(value) => `${value}%`}
					/>
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const data = payload[0];
							return (
								<ChartTooltipContent>
									<div className="flex items-center gap-2">
										<span>
											{data.payload.hand}: {data.value?.toFixed(1)}%
										</span>
									</div>
								</ChartTooltipContent>
							);
						}}
					/>
					<Line
						type="monotone"
						dataKey="winChance"
						stroke="var(--color-winChance)"
						strokeWidth={2}
						dot={{ r: 4 }}
						activeDot={{ r: 6 }}
					/>
				</LineChart>
			</ChartContainer>
			{winChanceHistory.length === 0 && (
				<div className="text-center text-xs text-muted-foreground">
					Nenhum dado ainda
				</div>
			)}
		</div>
	);
}



