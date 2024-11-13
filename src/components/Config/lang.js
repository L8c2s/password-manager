import { readTextFile } from "@tauri-apps/plugin-fs";

const PTBRLANG = {
    "Header": {
        "search.placeholder": "Use \"/\" para pesquisar"
    },
    "App": {
        "helloWorld": "Olá Mundo!"
    },
    "Settings": {
        ".title": "Configurações",
        "accounts-dir.placeholder": "Diretório para salvar e carregar contas",
        "change-accounts-dir.text": "Alterar",
        "months-to-update-pass.title": "Meses para Atualizar Senhas",
        "change-accounts-dir.title": "Diretório de Contas",
        "app-language-title.title": "Idioma",
        "update-language.text": "Aplicar",
        "create-text-file.title": "Criar arquivo de texto",
        "create-text-file.created": "Arquivo criado em",
        "create-text-file.explanation": "Crie um arquivo de texto simples com suas contas para fácil leitura e compartilhamento.",
        "create-text-file.select_folder": "Selecionar"
    },
    "AccountsList": {
        "sort-message.username": "Nome de Usuário",
        "sort-message.service": "Serviço",
        "sort-message.created": "Data de Criação",
        "sort-message.last-modified": "Última Modificação",
        "sort-message.no-filter": "Sem Filtro"
    },
    "AccountInfo": {
        "delete.confirmation": "Tem certeza que deseja excluir essa conta?",
        "service.title": "Serviço",
        "username.title": "Nome de Usuário",
        "password.title": "Senha",
        "notes.title": "Notas/Observações",
        "additional-info.last_modified": "Última modificação:",
        "additional-info.created": "Criado em:",
        "delete_account.no_id": "Não foi possível excluir a conta.",
        "delete_account.success": "A conta foi excluída.",
        "delete_account.confirmation": "Tem certeza que deseja excluir essa conta?"
    },
    "AddEditAccount": {
        "add_account.title": "Adicionar Conta",
        "edit_account.title": "Editar Conta",
        "edit_username.placeholder": "exemplo@gmail.com",
        "edit_notes.placeholder": "Opcional",
        "save_button.text": "Salvar",
        "cancel_button.text": "Cancelar",
        "notification_preview.title": "Prévia da Notificação",
        "password_length.display": "Comprimento:"
    },
    "notification": {
        "level_security.no_password": "Sua conta não possui uma senha.",
        "level_security.not_safe_enough": "A senha não é segura o suficiente.",
        "level_security.repeated_password": "Mais de uma conta possuem a mesma senha.",
        "level_security.safe": "Sua conta está segura."
    },
    "Login": {
        ".title": "Bem Vindo",
        "login_password.placeholder": "Sua senha",
        "login.submit": "Continuar",
        "login.tip00": "Digite uma senha que não seja difícil de lembrar, mas que seja segura para proteger todas as suas contas.",
        "login.tip01": "Esta será a única senha que você precisará lembrar.",
        "login.tip02": "Digite sua senha para continuar.",
        "login.verifying": "Verificando",
        "login.success": "Sucesso",
        "login.wrong_password": "Incorreta"
    }
}

const ENUSLANG = {
    "Header": {
        "search.placeholder": "Use \"/\" to search"
    },
    "App": {
        "helloWorld": "Hello World!"
    },
    "Settings": {
        ".title": "Settings",
        "accounts-dir.placeholder": "Directory to save and load all accounts",
        "change-accounts-dir.text": "Change",
        "months-to-update-pass.title": "Months to Update Password",
        "change-accounts-dir.title": "Accounts Directory",
        "app-language-title.title": "Language",
        "update-language.text": "Apply",
        "create-text-file.title": "Create text file",
        "create-text-file.created": "File created in",
        "create-text-file.explanation": "Create a simple to read and share text file with all your accounts.",
        "create-text-file.select_folder": "Select folder"
    },
    "AccountsList": {
        "sort-message.username": "Username",
        "sort-message.service": "Service",
        "sort-message.created": "Created",
        "sort-message.last-modified": "Last Modified",
        "sort-message.no-filter": "No Filter"
    },
    "AccountInfo": {
        "delete.confirmation": "Are you sure you want to delete this account?",
        "service.title": "Service",
        "username.title": "Username",
        "password.title": "Password",
        "notes.title": "Notes/Observations",
        "additional-info.last_modified": "Last modified:",
        "additional-info.created": "Created:",
        "delete_account.no_id": "Could not delete the account.",
        "delete_account.success": "The account was deleted.",
        "delete_account.confirmation": "Are you sure you want to delete this account?"
    },
    "AddEditAccount": {
        "add_account.title": "Add Account",
        "edit_account.title": "Edit Account",
        "edit_username.placeholder": "example@gmail.com",
        "edit_notes.placeholder": "Optional",
        "save_button.text": "Save",
        "cancel_button.text": "Cancel",
        "notification_preview.title": "Notification Preview",
        "password_length.display": "Password length:"
    },
    "notification": {
        "level_security.no_password": "Your account doesn't have a password.",
        "level_security.not_safe_enough": "The password isn't safe enough.",
        "level_security.repeated_password": "More than one account has the same password.",
        "level_security.safe": "Your account is safe."
    }
}

const LANGUAGES = {
    "en-US": ENUSLANG,
    "pt-BR": PTBRLANG
}


export function getMsg(langFile, key, sub) {
    if (!langFile) return;
    if (!langFile.hasOwnProperty(key)) return;
    if (!langFile[key].hasOwnProperty(sub)) return;

    return langFile[key][sub];
}

export function loadLangFile(langSet) {
    if (LANGUAGES.hasOwnProperty(langSet))
        return LANGUAGES[langSet];
    else
        return LANGUAGES["en-US"];
}