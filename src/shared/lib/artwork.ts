// Original cinematic key art shared by the local cinema catalogue and booking flow.
// Replace this resolver when movie-specific artwork becomes part of the API.
export function filmArtwork(_title?: string): string {
  return "/artwork/journey-beyond.png";
}
