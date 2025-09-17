declare namespace NodeJS {
  interface ProcessEnv {
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;

    // เพิ่มได้ตามต้องใช้ เช่น OAuth
    // GOOGLE_CLIENT_ID?: string;
    // GOOGLE_CLIENT_SECRET?: string;
  }
}
