import Requests from './requests';

class Principal {
    
    constructor(name) {
        this.name = name;
    }

    hasRole() {
        return true;
    }

    logout(onSuccess, onFailure) {
        return Requests.requestLogout(onSuccess, onFailure);
    }
}

const module = {};
Object.defineProperty(module, 'principal', {
    value: function (aOnSuccess, aOnFailure) {
        Requests.requestLoggedInUser(aOnSuccess ? aPrincipalName => {
            aOnSuccess(new Principal(aPrincipalName));
        } : null, aOnFailure);
    }
});
export default module;