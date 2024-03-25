export interface ClientInformation {
    client_id: string;
    client_secret?: string;
    redirect_uri: string;
}

export interface TokenInformation<ExpiresDataType> {
    access_token: string;
    refresh_token: string;
    expires_at: {
        access_token: ExpiresDataType;
        refresh_token: ExpiresDataType;
    };
}

export interface PersonalRecordBase {
    first_name: string;
    family_name: string;
    prefecture: string;
    city: string;
    address: string;
    gender: number;
    birthday: Date;
}

export interface PersonalRecord extends PersonalRecordBase {
    check_level: number;
}

export interface UserBase {
    user_id: string;
    name: string;
}

export interface UserUpdate extends Partial<UserBase> {
    password?: string;
}

export interface UserGet extends UserBase {
    id: string;
    mailaddress: string;
    account_type: number;
    created_at: Date;
    personality_classification: number;
    personal?: PersonalRecord;
}

export interface ApplicationBase {
    name: string;
    callback_url: string;
    privacy: string;
    description?: string;
    term?: string;
}

export interface ApplicationCreate extends ApplicationBase {
    public: boolean;
}

export interface ApplicationUpdate extends Partial<ApplicationBase> {
    regenerate_client_secret: boolean;
}

export interface ApplicationGetForEnum {
    name: string;
    client_id: string;
    description?: string;
}

export interface ApplicationGet extends ApplicationBase {
    developer: {
        id: string;
        name: string;
    };
}

export interface ApplicationCreateResult {
    client_id: string;
    client_secret: string;
}

const APIRoot = process.env.MEIGETSUID_SERVER ?? 'https://idportal.meigetsu.jp/api/v2';

export default class MeigetsuID {
    private Token: TokenInformation<Date>;
    constructor(TokenInfo: TokenInformation<string>) {
        this.Token = {
            access_token: TokenInfo.access_token,
            refresh_token: TokenInfo.refresh_token,
            expires_at: {
                access_token: new Date(TokenInfo.expires_at.access_token),
                refresh_token: new Date(TokenInfo.expires_at.refresh_token),
            },
        };
    }
    [Symbol.asyncDispose]() {
        return fetch(`${APIRoot}/auth`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
            },
        }).then(response => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
        });
    }
    public async GetUserRecord(ContainPersonal: boolean = false): Promise<UserGet> {
        return await fetch(`${APIRoot}/user?contain_personal=${ContainPersonal}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
            },
        }).then((response: Response) => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
            return response.json();
        });
    }
    public async RequestConfirmMailForUpdate(): Promise<void> {
        await fetch(APIRoot + '/user', {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
            },
        }).then((response: Response) => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
            return Promise.resolve();
        });
    }
    public async UpdateUserRecord(ConfirmID: string, NewData: Partial<UserUpdate>): Promise<void> {
        await fetch(APIRoot + '/user/' + ConfirmID, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(NewData),
        }).then((response: Response) => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
            return Promise.resolve();
        });
    }
    public async UpdateMailAddress(UpdateConfirmID: string, NewMailAddress: string): Promise<void> {
        return await fetch(APIRoot + '/user/' + UpdateConfirmID + '/mailaddress', {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
                'Content-Type': 'text/plain;charset=UTF-8',
            },
            body: NewMailAddress,
        }).then((response: Response) => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
            return Promise.resolve();
        });
    }
    public async SendMailAddressUpdateCode(ConfirmCode: string): Promise<void> {
        return await fetch(APIRoot + '/user/' + ConfirmCode + '/mailaddress', {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
            },
        }).then((response: Response) => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
            return Promise.resolve();
        });
    }
    public async UpdatePersonalRecord(UpdateConfirmID: string, NewRecord: Partial<PersonalRecordBase>): Promise<void> {
        return await fetch(APIRoot + '/user/mpim/' + UpdateConfirmID, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(NewRecord),
        }).then((response: Response) => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
            return Promise.resolve();
        });
    }
    public async CreateApplication(Data: ApplicationCreate): Promise<ApplicationCreateResult> {
        return await fetch(APIRoot + '/application', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Data),
        })
            .then((response: Response) => {
                if (response.status !== 200)
                    throw response.text().then(text => Promise.reject(new Error(`${response.status}: ${text}`)));
                return response.json();
            })
            .then(json => json as ApplicationCreateResult);
    }
    public async UpdateApplication(Data: ApplicationUpdate): Promise<ApplicationCreateResult | null> {
        return await fetch(APIRoot + '/application', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Data),
        }).then((response: Response) => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(new Error(`${response.status}: ${text}`)));
            return Data.regenerate_client_secret
                ? response.json().then(json => json as ApplicationCreateResult)
                : Promise.resolve(null);
        });
    }
    public async GetApplication(): Promise<ApplicationGetForEnum[]>;
    public async GetApplication(ClientId: string): Promise<ApplicationGet>;
    public async GetApplication(ClientId?: string): Promise<ApplicationGet | ApplicationGetForEnum[]> {
        if (ClientId == null) {
            return await fetch(APIRoot + '/application', {
                headers: {
                    Authorization: `Bearer ${this.Token.access_token}`,
                },
            })
                .then(response => response.json())
                .then(json => json.applications);
        } else {
            return await fetch(`${APIRoot}/application/${ClientId}`)
                .then(response => {
                    if (response.status !== 200)
                        return response.text().then(text => Promise.reject(new Error(`${response.status}: ${text}`)));
                    return response.json();
                })
                .then(json => json as ApplicationGet);
        }
    }
    public async DeleteApplication(ClientId: string): Promise<void> {
        return await fetch(`${APIRoot}/application/${ClientId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
            },
        }).then(response => {
            if (response.status !== 200)
                return response.text().then(text => Promise.reject(new Error(`${response.status}: ${text}`)));
        });
    }
    public async CheckIdentificationStatus(
        BorderLevel: number,
        CompareMode: 'equal' | 'not_equal' | 'greater' | 'greater_equal' | 'less' | 'less_equal'
    ): Promise<boolean> {
        return await fetch(`${APIRoot}/user/mpim/status?level=${BorderLevel}&compare_mode=${CompareMode}`, {
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
            },
        })
            .then(response => {
                if (response.status !== 200)
                    return response.text().then(text => Promise.reject(new Error(`${response.status}: ${text}`)));
                return response.json();
            })
            .then(json => json.result);
    }
    public async CheckAge(
        BorderAge: number,
        CompareMode: 'equal' | 'not_equal' | 'greater' | 'greater_equal' | 'less' | 'less_equal'
    ): Promise<{ result: boolean; level: number }> {
        return await fetch(`${APIRoot}/user/mpim/age?age=${BorderAge}&compare_mode=${CompareMode}`, {
            headers: {
                Authorization: `Bearer ${this.Token.access_token}`,
            },
        })
            .then(response => {
                if (response.status !== 200)
                    return response.text().then(text => Promise.reject(new Error(`${response.status}: ${text}`)));
                return response.json();
            })
            .then(json => {
                return {
                    result: json.result,
                    level: json.level,
                };
            });
    }
}

export async function GetAuthorizationID(
    ClientInfo: ClientInformation,
    Scopes: string[],
    CodeChallenge: string,
    CodeChallengeMethod: string
): Promise<string> {
    return await fetch(`${APIRoot}/auth`, {
        method: 'POST',
        body: JSON.stringify({
            client_id: ClientInfo.client_id,
            client_secret: ClientInfo.client_secret ?? 'public',
            scope: Scopes,
            callback_url: ClientInfo.redirect_uri,
            code_challenge: CodeChallenge,
            code_challenge_method: CodeChallengeMethod,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => {
        if (response.status !== 200) return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
        return response.text();
    });
}

async function GetTokenByAuthCode(AuthCode: string, PKCEVerifyValue: string): Promise<TokenInformation<string>> {
    return await fetch(`${APIRoot}/auth/token`, {
        method: 'POST',
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code: AuthCode,
            code_verifier: PKCEVerifyValue,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => {
        if (response.status !== 200) return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
        return response.json();
    });
}

async function GetTokenByRefreshToken(RefreshToken: string): Promise<TokenInformation<string>> {
    return await fetch(`${APIRoot}/auth/token`, {
        method: 'POST',
        body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: RefreshToken,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => {
        if (response.status !== 200) return response.text().then(text => Promise.reject(`${response.status}: ${text}`));
        return response.json();
    });
}

export async function GetToken(RefreshToken: string): Promise<TokenInformation<string>>;
export async function GetToken(AuthCode: string, PKCEVerifyValue: string): Promise<TokenInformation<string>>;
export async function GetToken(
    RefreshTokenOrAuthCode: string,
    PKCEVerifyValue?: string
): Promise<TokenInformation<string>> {
    return PKCEVerifyValue == null
        ? await GetTokenByRefreshToken(RefreshTokenOrAuthCode)
        : await GetTokenByAuthCode(RefreshTokenOrAuthCode, PKCEVerifyValue);
}
