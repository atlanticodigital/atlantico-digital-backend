module.exports = (cep) => {

    var express = /^[0-9]{2}.[0-9]{3}-[0-9]{3}$/;

    cep = cep.trim()

    if(cep.length > 0)
    {
        if(express.test(cep))
            return true
        else
            return false
    }
    else
        return false

}