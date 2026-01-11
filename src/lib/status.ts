export default function isSuccessful(status: number) {
  return 200 <= status && status <= 299;
}
