// 95 ADMIN, 96 FINANC, 97 HR, 98 FTAX

module.exports = (profile,name=false) => {
    let output;

    switch (profile) {
        case 95:
        case "95":
        case "ADMIN":
            output = name ? "Administrativo" : "ADMIN"
            break
        case 96:
        case "96":
        case "FINANC":
            output = name ? "Financeiro" : "FINANC"
            break
        case 97:
        case "97":
        case "HR":
            output = name ? "Recursos Humanos" : "HR"
            break
        case 98:
        case "98":
        case "FTAX":
            output = name ? "Fiscal e Tributário" : "FTAX"
            break
    }

    return output
}