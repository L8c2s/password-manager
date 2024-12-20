const PTBRLANG = {
    titles: {
        settings: "Configurações",
        changeAccountsDir: "Diretório de Contas",
        createTextFile: "Criar arquivo de texto",
        openBackupFolder: "Recuperar contas",
        sortUsername: "Nome de Usuário",
        sortService: "Serviço",
        sortCreated: "Data de Criação",
        sortLastModified: "Última Modificação",
        sortNoFilter: "Sem Filtro",
        accountDeleteConfirm: "Tem certeza que deseja excluir essa conta?",
        accountInfoService: "Serviço",
        accountInfoUsername: "Nome de Usuário",
        accountInfoPassword: "Senha",
        accountInfoNotes: "Notas/Observações",
        accountInfoLastModified: "Última modificação:",
        accountInfoCreated: "Criado em:",
        addAccount: "Adicionar Conta",
        editAccount: "Editar Conta",
        notificationPreview: "Prévia da Notificação",
        passwordHistory: "Histórico de senhas",
        login: "Bem Vindo"

    },
    placeholders: {
        search: "Use \"/\" para pesquisar",
        accountsDir: "Diretório para salvar e carregar contas",
        editUsername: "exemplo@gmail.com",
        editNotes: "Opcional",
        loginPassword: "Sua senha"
    },
    buttons: {
        changeAccountsDir: "Alterar",
        updateLanguage: "Aplicar",
        createTextFileSelectFolder: "Selecionar",
        openBackupFolder: "Abrir",
        save: "Salvar",
        cancel: "Cancelar",
        loginSubmit: "Continuar"
    },
    messages: {
        textFileCreated: "Arquivo criado em",
        createTextFileExplanation: "Crie um arquivo de texto simples com suas contas para fácil leitura e compartilhamento.",
        openBackupFolderExplanation: "Se precisar recuperar suas contas salvas, clique no botão abaixo, escolha o arquivo desejado, digite sua senha e o aplicativo restaurará suas contas automaticamente.",
        recoverTip: "Você pode recuperar suas contas aqui",
        deleteAccountError: "Não foi possível excluir a conta.",
        deleteAccountSuccess:"A conta foi excluída.",
        passwordLengthDisplay: "Comprimento:",
        savingAccount: "Salvando",
        verifying: "Verificando",
        success: "Sucesso",
        wrongPassword: "Incorreta",
        levelSecurityNoPassword: "Sua conta não possui uma senha.",
        levelSecurityNotSafeEnough: "A senha não é segura o suficiente.",
        levelSecurityRepeatedPassword: "Mais de uma conta possuem a mesma senha.",
        levelSecuritySafe: "Sua conta está segura.",
        monthsToUpdatePass: "Meses para Atualizar Senhas",
        appLanguage: "Idioma",
        passwordAddedIn: "Adicionado em: ",
        passwordCurrent: "(Atual)",
        loginTip0: "Digite uma senha que não seja difícil de lembrar, mas que seja segura para protejer todas as suas contas.",
        loginTip1: "Esta será a única senha que você precisará lembrar.",
        loginTip2: "Digite sua senha para continuar",
        newAccountTip0: "Você pode clicar em + ou pressionar \"Ctrl + N\" para criar uma nova conta"
    }
}

const ENLANG = {
    titles: {
        settings: "Settings",
        changeAccountsDir: "Accounts Directory",
        createTextFile: "Create Text File",
        openBackupFolder: "Recover Accounts",
        sortUsername: "Username",
        sortService: "Service",
        sortCreated: "Created Date",
        sortLastModified: "Last Modified",
        sortNoFilter: "No Filter",
        accountDeleteConfirm: "Are you sure you want to delete this account?",
        accountInfoService: "Service",
        accountInfoUsername: "Username",
        accountInfoPassword: "Password",
        accountInfoNotes: "Notes/Observations",
        accountInfoLastModified: "Last modified:",
        accountInfoCreated: "Created on:",
        addAccount: "Add Account",
        editAccount: "Edit Account",
        notificationPreview: "Notification Preview",
        passwordHistory: "Password History",
        login: "Welcome"

    },
    placeholders: {
        search: "Use \"/\" to search",
        accountsDir: "Directory to save and load accounts",
        editUsername: "example@gmail.com",
        editNotes: "Optional",
        loginPassword: "Your password"
    },
    buttons: {
        changeAccountsDir: "Change",
        updateLanguage: "Apply",
        createTextFileSelectFolder: "Select",
        openBackupFolder: "Open",
        save: "Save",
        cancel: "Cancel",
        loginSubmit: "Continue"
    },
    messages: {
        textFileCreated: "File created in",
        createTextFileExplanation: "Create a simple text file with your accounts for easy reading and sharing.",
        openBackupFolderExplanation: "If you need to recover your saved accounts, click the button below, choose the desired file, enter your password and the application will restore your accounts automatically.",
        recoverTip: "You can recover your accounts here",
        deleteAccountError: "Could not delete the account.",
        deleteAccountSuccess: "The account has been deleted.",
        passwordLengthDisplay: "Length:",
        savingAccount: "Saving",
        verifying: "Verifying",
        success: "Success",
        wrongPassword: "Incorrect",
        levelSecurityNoPassword: "Your account does not have a password.",
        levelSecurityNotSafeEnough: "The password is not strong enough.",
        levelSecurityRepeatedPassword: "More than one account has the same password.",
        levelSecuritySafe: "Your account is secure.",
        monthsToUpdatePass: "Months to Update Passwords",
        appLanguage: "Language",
        passwordAddedIn: "Added on: ",
        passwordCurrent: "(Current)",
        loginTip0: "Enter a password that is not difficult to remember, but that is secure enough to protect all your accounts.",
        loginTip1: "This will be the only password you will need to remember.",
        loginTip2: "Enter your password to continue",
        newAccountTip0: "You can click on + or press \"Ctrl + N\" to create a new account"
    }
}

const LANGUAGES = {
    "en-US": ENLANG,
    "pt-BR": PTBRLANG
}

export function loadLangFile(langSet) {
    if (LANGUAGES.hasOwnProperty(langSet))
        return LANGUAGES[langSet];
    else
        return LANGUAGES["en-US"];
}