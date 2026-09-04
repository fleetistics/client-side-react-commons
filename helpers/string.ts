export class StringUtils {
    public static isEmpty(value: string | null | undefined): boolean {
        return value == null || value.trim().length === 0;
    }
}