import * as Phaser from "phaser";

export class BlackjackButton extends Phaser.GameObjects.Container {
	private bg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
	private text: Phaser.GameObjects.Text;
	private callback: () => void; // Store callback to re-bind events

	constructor(scene: Phaser.Scene, x: number, y: number, label: string, color: number, callback: () => void, texture?: string) {
		super(scene, x, y);
		this.callback = callback;

		// Button Background
		if (texture) {
			this.bg = scene.add.image(0, 0, texture);
			this.bg.setDisplaySize(240, 100);
		} else {
			this.bg = scene.add.rectangle(0, 0, 240, 100, color);
			this.bg.setStrokeStyle(4, 0xffffff);
		}

		// Button Text
		this.text = scene.add
			.text(0, 0, label, {
				fontSize: "40px",
				color: "#ffffff",
				fontStyle: "bold",
			})
			.setOrigin(0.5);

		this.add([this.bg, this.text]);

		this.setupInteractions();
		scene.add.existing(this);
	}

	private setupInteractions() {
		this.bg.setInteractive({ useHandCursor: true });

		this.bg.on("pointerdown", () => {
			this.animateClick();
			this.callback();
		});

		this.bg.on("pointerover", () => this.bg.setAlpha(0.8));
		this.bg.on("pointerout", () => this.bg.setAlpha(1));
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

	public updateTexture(textureKey: string) {
		// remove old background
		if (this.bg) {
			this.bg.destroy();
		}

		// Create new image background
		this.bg = this.scene.add.image(0, 0, textureKey);
		this.bg.setDisplaySize(240, 100);

		// Insert at index 0 (bottom) so text remains on top
		this.addAt(this.bg, 0);

		// Re-apply interactions since we destroyed the old object
		this.setupInteractions();
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
