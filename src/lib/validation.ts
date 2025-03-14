import { CIP60FormData, ValidationResult } from '@/types';

export function validateForm(formData: CIP60FormData): ValidationResult {
  const errors: string[] = [];

  if (!formData.artists[0]?.name) {
    errors.push('Primary artist name is required');
  }

  if (!formData.releaseTitle) errors.push('Release title is required');
  if (!formData.songTitle) errors.push('Song title is required');
  if (!formData.recordingOwner) errors.push('Recording owner is required');
  if (!formData.isAIGenerated && !formData.compositionOwner) {
    errors.push('Composition owner is required');
  }

  if (!formData.songFile) errors.push('Song file is required');
  if (!formData.coverArtFile) errors.push('Cover art is required');

  if (!formData.quantity || formData.quantity < 1) {
    errors.push('Token mint quantity must be at least 1');
  }

  if (!formData.genre) {
    errors.push('Primary genre is required');
  }

  [...formData.artists, ...formData.featuredArtists].forEach((artist, index) => {
    if (!artist.name.trim()) {
      errors.push(`Artist ${index + 1} name is required`);
    }
  });

  formData.contributingArtists.forEach((artist, index) => {
    if (!artist.name.trim()) {
      errors.push(`Contributing artist ${index + 1} name is required`);
    }
    if (artist.roles.length === 0) {
      errors.push(`Contributing artist ${index + 1} must have at least one role`);
    }
  });

  if (!formData.isAIGenerated && formData.authors.length > 0) {
    formData.authors.forEach((author, index) => {
      if (!author.name.trim()) {
        errors.push(`Author ${index + 1} name is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}