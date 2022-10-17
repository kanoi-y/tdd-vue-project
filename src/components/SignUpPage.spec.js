import { cleanup, fireEvent, render, screen } from "@testing-library/vue";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import SignUpPage from "./SignUpPage.vue";

describe("SignUpPage", () => {
  beforeEach(() => {
    render(SignUpPage);
  });
  afterEach(cleanup);

  describe("レイアウト", () => {
    it("Sign Upヘッダーが表示される", () => {
      const header = screen.getByRole("heading", { name: "Sign Up" });
      expect(header).toBeTruthy();
    });

    it("ユーザー名の入力フォームが表示される", () => {
      const input = screen.queryByLabelText("ユーザー名");
      expect(input).toBeTruthy();
    });

    it("メールアドレスの入力フォームが表示される", () => {
      const input = screen.queryByLabelText("メールアドレス");
      expect(input).toBeTruthy();
    });

    it("パスワードの入力フォームのtypeがpasswordであること", () => {
      const input = screen.getByLabelText("パスワード");
      expect(input.type).toBe("password");
    });

    it("登録用ボタンが表示される", () => {
      const button = screen.getByRole("button", { name: "登録" });
      expect(button).toBeTruthy();
    });

    it("登録ボタンが初期表示時はdisabledとなっている", () => {
      const button = screen.getByRole("button", { name: "登録" });
      expect(button.disabled).toBeTruthy();
    });
  });

  describe("インタラクション", () => {
    it("全フォーム入力済み、かつパスワードとパスワード確認が同じ値の場合、登録のdisabledが解除される", async () => {
      await fillAllForm("User", "user@example.com", "P4ssw0rd", "P4ssw0rd");
      const button = screen.getByRole("button", { name: "登録" });
      expect(button.disabled).toBe(false);
    });
    it("全フォーム入力済でも、パスワードが不一致の場合、登録ボタンがdisabledになる", async () => {
      await fillAllForm("User", "user@example.com", "P4ssw0rd", "password");
      const button = screen.getByRole("button", { name: "登録" });
      expect(button.disabled).toBe(true);
    });

    it("登録ボタン押下時にユーザー名、メールアドレス、パスワードをサーバーに送信する", async () => {
      let requestBody;
      const server = setupServer(
        rest.post("/api/v1/users", async (req, res, ctx) => {
          requestBody = await req.json();
          return res(ctx.status(200));
        })
      );
      server.listen();

      await fillAllForm("Usern", "user@example.com", "P4ssw0rd", "P4ssw0rd");
      const button = screen.getByRole("button", { name: "登録" });
      await fireEvent.click(button);

      await server.close();

      expect(requestBody).toEqual({
        username: "Usern",
        email: "user@example.com",
        password: "P4ssw0rd",
      });
    });

    it("登録時にサーバーからエラーが返された場合、エラーメッセージを表示する", async () => {
      const server = setupServer(
        rest.post("/api/v1/users", async (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                message: "サーバーエラーです。時間を置いて試してください。",
              },
            })
          );
        })
      );
      server.listen();

      await fillAllForm("Error1", "user@example.com", "P4ssw0rd", "P4ssw0rd");
      const button = screen.getByRole("button", { name: "登録" });
      await fireEvent.click(button);
      await server.close();

      const text = await screen.findByText(
        "サーバーエラーです。時間を置いて試してください。"
      );
      expect(text).toBeTruthy();
    });
  });
});

async function fillAllForm(username, email, passowrd, passwordCheck) {
  const usernameInput = screen.getByLabelText("ユーザー名");
  const emailInput = screen.getByLabelText("メールアドレス");
  const passwordInput = screen.getByLabelText("パスワード");
  const passwordCheckInput = screen.getByLabelText("パスワード確認");
  await fireEvent.update(usernameInput, username);
  await fireEvent.update(emailInput, email);
  await fireEvent.update(passwordInput, passowrd);
  await fireEvent.update(passwordCheckInput, passwordCheck);
}
