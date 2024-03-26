# Meigetsu ID API Library

このライブラリは、[Meigetsu ID](https://idportal.meigetsu.jp/)のラッパーライブラリです。

APIの利用には、Meigetsu IDのクライアントIDとクライアントシークレット（アプリケーションの種類がConfidentialの場合）が必要になります。

これらは、Meigetsu IDに登録後、アプリケーションの登録を行うことで実施することができます。

## インストール方法

ライブラリは不具合修正やMeigetsu IDのアップデートに基づいて更新されるため、特段何か問題が無い限りは常に最新のものを使用して下さい。

最新のバージョン番号は[こちら](https://library.meigetsu.jp/)でご確認下さい。

### NPMを使用する場合

下記コマンドを実行して下さい。

なお、型データはライブラリに同梱されておりますので、別途インストールする必要はありません。

```shell
npm install meigetsuidlib --save
```

### HTMLのscriptタグを使って呼び出す場合

下記をheadに追加して下さい。

```html
<script src="https://library.meigetsu.jp/meigetsuid/(バージョン番号)/index.js"></script>
```

## アクセストークンの取得方法（リフレッシュトークンが無い場合）

### 1. GetAuthorizationIDで認可ＩＤを取得する

> ### アプリケーションの種類がConfidentialの場合
>
>```javascript
>import { GetAuthorizationID } from 'meigetsuidlib';
>
>const AuthorizationID = await GetAuthorizationID({ client_id: '<input your app client id>', client_secret: '<input your app client secret>', redirect_uri: '<input your app entried redirect uri>' }, [ 'user.read', 'user.write' ], '<input PKCE hashed value>', '<input PKCE hash method>');
>```
>
> ### アプリケーションの種類がPublicの場合
>
>```javascript
>import { GetAuthorizationID } from 'meigetsuidlib';
>
>const AuthorizationID = await GetAuthorizationID({ client_id: '<input your app client id>', redirect_uri: '<input your app entried redirect uri>' }, [ 'user.read', 'user.write' ], '<input PKCE hashed value>', '<input PKCE hash method>');
>```
>
> ### 認可コードの取得方法について
>
> Meigetsu IDは[RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)に定義する認可コードフローを採用しております。
>
> そのため、認可エンドポイントへのリクエストの方法で認可ＩＤを取得することもできます。
>
> ＵＲＬの生成については[こちら](https://idportal.meigetsu.jp/api/urlgen)で行うことができます。
>
> ### Scopeについて
>  
> `GetAuthorizationID`の第２引数は、scopeを配列で指定する形となっています。
>
> 指定可能なScopeについては[こちらのページ](https://idportal.meigetsu.jp/api/spec)のAuthorizeのボタンを押すとScopesのセクションをご確認下さい。
>
> なお、Scopeについてはアプリケーションの種類やデベロッパーのアカウント種別によって使えるものが異なります。
>

### 2. Meigetsu IDの認可ページへリダイレクトし、ユーザーに認可を要求する

> `https://idportal.meigetsu.jp/oauth`へリダイレクトしていただく形となります。
>
> この時、クエリパラメーター`auth_id`を加える必要があります。
>
> `auth_id`の値は、`GetAuthorizationID`の戻り値です。
>
> ```javascript
> location.href = 'https://idportal.meigetsu.jp/oauth?auth_id=' + AuthorizationID;
> ```
>
> ユーザーが認可すると、Meigetsu IDはクエリパラメーターとしてauth_code（認可コード）を付与し、事前に登録されたリダイレクトＵＲＬに自動的にリダイレクトします。
>

### 3. アクセストークンを取得する

> クエリパラメーター`auth_code`の値を取得し、これと`code_challenge`（`GetAuthorizationID`の第３引数）の元の値を`GetToken`に渡します。
>
> ```javascript
> const token = await GetToken('<input auth code>', '<input code verifier>');
> ```
>
> `GetToken`の戻り値はオブジェクト（JSON）となっており、形式は、下記の通りです。
>
> ```json
> {
>     "token_type": "Bearer",
>     "access_token": "access token(text length: 256)",
>     "refresh_token": "refresh token(text length: 256)",
>     "expires_at": {
>         "access_token": "access token expires datetime(ISO8601 compliant)",
>         "refresh_token": "refresh token expires datetime(ISO8601 compliant"
>     }
> }
> ```

## アクセストークンの取得方法（リフレッシュトークンがある場合）

> リフレッシュトークンを`GetToken`の第１引数に渡します。
>
> この時、第２引数は入れないで下さい。
>
> ```javascript
> const token = await GetToken('<input refresh token>');
> ```
>
> `GetToken`の戻り値の型および形式は、アクセストークンの取得方法（リフレッシュトークンがある場合）の[アクセストークンを取得する](#3-アクセストークンを取得する)に記載のものと同じです。
