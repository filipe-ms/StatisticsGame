import * as Phaser from "phaser";

export class BlackjackButton extends Phaser.GameObjects.Container {
	private bg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
	private text: Phaser.GameObjects.Text;

	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		label: string,
		color: number,
		callback: () => void,
		texture?: string // Added optional texture parameter
	) {
		super(scene, x, y);

		// Button Background
		if (texture) {
			this.bg = scene.add.image(0, 0, texture);
			// Scale to match standard button size for consistency
			this.bg.setDisplaySize(240, 100);
		} else {
			this.bg = scene.add.rectangle(0, 0, 240, 100, color);
			this.bg.setStrokeStyle(4, 0xffffff);
		}

		this.bg.setInteractive({ useHandCursor: true });

		// Button Text
		this.text = scene.add
			.text(0, 0, label, {
				fontSize: "40px",
				color: "#ffffff",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		this.add([this.bg, this.text]);

		// Interactions
		this.bg.on("pointerdown", () => {
			this.animateClick();
			callback();
		});

		this.bg.on("pointerover", () => this.bg.setAlpha(0.8));
		this.bg.on("pointerout", () => this.bg.setAlpha(1));

		scene.add.existing(this);
	}

	private animateClick() {
		this.scene.tweens.add({
			targets: this,
			scaleX: 0.95,
			scaleY: 0.95,
			duration: 50,
			yoyo: true,
		});
	}

	public setVisible(value: boolean): this {
		super.setVisible(value);
		// Ensure interactivity is disabled when hidden to prevent ghost clicks
		if (this.bg) {
			if (value) this.bg.setInteractive();
			else this.bg.disableInteractive();
		}
		return this;
	}
}
