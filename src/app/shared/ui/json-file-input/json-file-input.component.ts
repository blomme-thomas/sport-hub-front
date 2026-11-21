import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

let nextId = 0;

/**
 * Zone de saisie d'un contenu JSON : fichier `.json` à choisir, ou texte collé. Le contenu brut est émis à chaque
 * changement ; la validation revient au parent. Sert aux imports de séances (création, édition, import multiple).
 */
@Component({
  selector: 'sh-json-file-input',
  templateUrl: './json-file-input.component.html',
  styleUrl: './json-file-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFileInputComponent {
  readonly label = input.required<string>();
  readonly disabled = input(false);

  readonly contentChange = output<string>();

  private readonly baseId = `sh-json-input-${nextId++}`;
  protected readonly fileInputId = `${this.baseId}-file`;
  protected readonly textareaId = `${this.baseId}-text`;
  protected readonly fileName = signal<string | null>(null);
  protected readonly text = signal('');

  protected async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) {
      return;
    }
    const content = await file.text();
    this.fileName.set(file.name);
    this.text.set(content);
    this.contentChange.emit(content);
  }

  protected onText(event: Event): void {
    const content = (event.target as HTMLTextAreaElement).value;
    this.fileName.set(null);
    this.text.set(content);
    this.contentChange.emit(content);
  }
}
