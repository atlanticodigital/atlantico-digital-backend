// 95 ADMIN, 96 FINANC, 97 HR, 98 FTAX

module.exports = (profile) => {
    let output;

    switch (profile) {
        case 95:
        case "95":
            output = "ADMIN"
            break
        case 96:
        case "96":
            output = "FINANC"
            break
        case 97:
        case "97":
            output = "HR"
            break
        case 98:
        case "98":
            output = "FTAX"
            break
    }

    return output
}