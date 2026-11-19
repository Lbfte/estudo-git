/**
 * Script de validação e orientação do formulário de cadastro - IngressosFácil
 * Funcionalidades:
 * - Validações em tempo real (input e blur) e no envio (submit)
 * - Máscaras dinâmicas para CPF e Telefone
 * - Algoritmo oficial de verificação dos dígitos do CPF
 * - Medidor de força da senha com lista interativa de requisitos
 * - Validação de confirmação de senha idêntica
 * - Verificação de idade mínima pela data de nascimento
 * - Feedback visual acessível usando classes padrão do Bootstrap (is-valid / is-invalid)
 * - Modal / alerta amigável de sucesso com resumo dos dados
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastro');

    // Elementos do formulário
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    const nascimentoInput = document.getElementById('nascimento');
    const senhaInput = document.getElementById('senha');
    const confirmaSenhaInput = document.getElementById('confirmaSenha');
    const termosInput = document.getElementById('termos');

    // Botões de alternar visualização de senha
    const toggleSenhaBtn = document.getElementById('toggleSenha');
    const toggleConfirmaBtn = document.getElementById('toggleConfirma');

    // Elementos do medidor de força de senha
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const reqLength = document.getElementById('req-length');
    const reqLetter = document.getElementById('req-letter');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    // Modal de sucesso
    const modalSucessoEl = document.getElementById('modalSucesso');
    const modalSucesso = modalSucessoEl ? new bootstrap.Modal(modalSucessoEl) : null;
    const resumoNome = document.getElementById('resumoNome');
    const resumoEmail = document.getElementById('resumoEmail');
    const resumoCpf = document.getElementById('resumoCpf');

    /* ==========================================================================
       1. FUNÇÕES AUXILIARES DE FEEDBACK VISUAL
       ========================================================================== */
    function setValido(input, feedbackEl) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (feedbackEl) {
            feedbackEl.textContent = '';
        }
    }

    function setInvalido(input, feedbackEl, mensagem) {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        if (feedbackEl) {
            feedbackEl.textContent = mensagem;
        }
    }

    function limpaStatus(input) {
        input.classList.remove('is-valid', 'is-invalid');
    }

    /* ==========================================================================
       2. MÁSCARAS DE ENTRADA
       ========================================================================== */
    // Máscara para CPF: 000.000.000-00
    cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
        }

        e.target.value = value;
        validaCpfInput();
    });

    // Máscara para Telefone: (00) 00000-0000 ou (00) 0000-0000
    telefoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 10) {
            // Celular com 9 dígitos
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        } else if (value.length > 0) {
            value = value.replace(/^(\d*)$/, '($1');
        }

        e.target.value = value;
        validaTelefoneInput();
    });

    /* ==========================================================================
       3. REGRAS DE VALIDAÇÃO
       ========================================================================== */
    // Validação de Nome Completo
    function validaNomeInput() {
        const feedback = document.getElementById('feedbackNome');
        const valor = nomeInput.value.trim();

        if (!valor) {
            setInvalido(nomeInput, feedback, 'Por favor, informe seu nome completo.');
            return false;
        }

        // Deve conter pelo menos 2 palavras e apenas letras e acentos
        const partes = valor.split(/\s+/);
        const regexLetras = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;

        if (!regexLetras.test(valor)) {
            setInvalido(nomeInput, feedback, 'O nome deve conter apenas letras.');
            return false;
        }

        if (partes.length < 2 || partes[0].length < 2 || partes[1].length < 2) {
            setInvalido(nomeInput, feedback, 'Por favor, digite seu nome e pelo menos um sobrenome.');
            return false;
        }

        setValido(nomeInput, feedback);
        return true;
    }

    // Validação de E-mail
    function validaEmailInput() {
        const feedback = document.getElementById('feedbackEmail');
        const valor = emailInput.value.trim();

        if (!valor) {
            setInvalido(emailInput, feedback, 'Por favor, informe seu e-mail.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(valor)) {
            setInvalido(emailInput, feedback, 'Digite um endereço de e-mail válido (ex: seu.nome@email.com).');
            return false;
        }

        setValido(emailInput, feedback);
        return true;
    }

    // Algoritmo oficial de validação de CPF (dígitos verificadores)
    function isCpfValido(cpfLimpo) {
        if (cpfLimpo.length !== 11) return false;

        // Elimina CPFs conhecidos inválidos (todos números iguais)
        if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

        // Validação do 1º dígito
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpfLimpo.charAt(i), 10) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpfLimpo.charAt(9), 10)) return false;

        // Validação do 2º dígito
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpfLimpo.charAt(i), 10) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpfLimpo.charAt(10), 10)) return false;

        return true;
    }

    function validaCpfInput() {
        const feedback = document.getElementById('feedbackCpf');
        const limpo = cpfInput.value.replace(/\D/g, '');

        if (!limpo) {
            setInvalido(cpfInput, feedback, 'Por favor, informe seu CPF.');
            return false;
        }

        if (limpo.length < 11) {
            setInvalido(cpfInput, feedback, 'O CPF deve conter 11 dígitos.');
            return false;
        }

        if (!isCpfValido(limpo)) {
            setInvalido(cpfInput, feedback, 'CPF inválido. Verifique os números digitados.');
            return false;
        }

        setValido(cpfInput, feedback);
        return true;
    }

    // Validação de Telefone
    function validaTelefoneInput() {
        const feedback = document.getElementById('feedbackTelefone');
        const limpo = telefoneInput.value.replace(/\D/g, '');

        if (!limpo) {
            setInvalido(telefoneInput, feedback, 'Por favor, informe seu número de telefone/WhatsApp.');
            return false;
        }

        if (limpo.length < 10 || limpo.length > 11) {
            setInvalido(telefoneInput, feedback, 'Informe um telefone com DDD válido (10 ou 11 dígitos).');
            return false;
        }

        // Validação básica de DDD (entre 11 e 99)
        const ddd = parseInt(limpo.substring(0, 2), 10);
        if (ddd < 11 || ddd > 99) {
            setInvalido(telefoneInput, feedback, 'DDD inválido.');
            return false;
        }

        setValido(telefoneInput, feedback);
        return true;
    }

    // Validação de Data de Nascimento (Idade mínima: 14 anos)
    function validaNascimentoInput() {
        const feedback = document.getElementById('feedbackNascimento');
        const valor = nascimentoInput.value;

        if (!valor) {
            setInvalido(nascimentoInput, feedback, 'Informe sua data de nascimento.');
            return false;
        }

        const dataNasc = new Date(valor + 'T00:00:00');
        const hoje = new Date();

        if (isNaN(dataNasc.getTime())) {
            setInvalido(nascimentoInput, feedback, 'Data de nascimento inválida.');
            return false;
        }

        if (dataNasc > hoje) {
            setInvalido(nascimentoInput, feedback, 'A data de nascimento não pode ser no futuro.');
            return false;
        }

        // Cálculo de idade
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const m = hoje.getMonth() - dataNasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
            idade--;
        }

        if (idade < 14) {
            setInvalido(nascimentoInput, feedback, 'É necessário ter pelo menos 14 anos para se cadastrar.');
            return false;
        }

        if (idade > 120) {
            setInvalido(nascimentoInput, feedback, 'Por favor, insira um ano de nascimento válido.');
            return false;
        }

        setValido(nascimentoInput, feedback);
        return true;
    }

    // Verificação de requisitos e medidor de força da senha
    function atualizaRequisito(elem, cumprido) {
        const icon = elem.querySelector('i');
        if (cumprido) {
            elem.classList.remove('unmet');
            elem.classList.add('met');
            if (icon) {
                icon.className = 'bi bi-check-circle-fill text-success';
            }
        } else {
            elem.classList.remove('met');
            elem.classList.add('unmet');
            if (icon) {
                icon.className = 'bi bi-circle text-secondary';
            }
        }
    }

    function avaliaForcaSenha(senha) {
        let pontos = 0;

        const hasLength = senha.length >= 8;
        const hasLetters = /[a-z]/.test(senha) && /[A-Z]/.test(senha);
        const hasNumber = /[0-9]/.test(senha);
        const hasSpecial = /[^A-Za-z0-9]/.test(senha);

        atualizaRequisito(reqLength, hasLength);
        atualizaRequisito(reqLetter, hasLetters);
        atualizaRequisito(reqNumber, hasNumber);
        atualizaRequisito(reqSpecial, hasSpecial);

        if (hasLength) pontos++;
        if (hasLetters) pontos++;
        if (hasNumber) pontos++;
        if (hasSpecial) pontos++;

        // Atualiza a barra de força
        strengthBar.className = 'password-strength-bar';
        if (senha.length === 0) {
            strengthBar.style.width = '0%';
            strengthText.textContent = '';
        } else if (pontos <= 2) {
            strengthBar.classList.add('strength-fraca');
            strengthText.textContent = 'Força: Fraca';
            strengthText.className = 'form-text text-danger fw-semibold';
        } else if (pontos === 3) {
            strengthBar.classList.add('strength-media');
            strengthText.textContent = 'Força: Média';
            strengthText.className = 'form-text text-warning fw-semibold';
        } else {
            strengthBar.classList.add('strength-forte');
            strengthText.textContent = 'Força: Forte e segura!';
            strengthText.className = 'form-text text-success fw-semibold';
        }

        return {
            valida: hasLength && hasLetters && hasNumber && hasSpecial,
            pontos: pontos
        };
    }

    function validaSenhaInput() {
        const feedback = document.getElementById('feedbackSenha');
        const senha = senhaInput.value;
        const avaliacao = avaliaForcaSenha(senha);

        if (!senha) {
            setInvalido(senhaInput, feedback, 'Por favor, crie uma senha.');
            return false;
        }

        if (!avaliacao.valida) {
            setInvalido(senhaInput, feedback, 'Sua senha deve cumprir todos os 4 requisitos abaixo.');
            return false;
        }

        setValido(senhaInput, feedback);

        // Se o campo de confirmação já estiver preenchido, revalida-o
        if (confirmaSenhaInput.value) {
            validaConfirmaSenhaInput();
        }

        return true;
    }

    // Validação da Confirmação de Senha
    function validaConfirmaSenhaInput() {
        const feedback = document.getElementById('feedbackConfirmaSenha');
        const senha = senhaInput.value;
        const confirmacao = confirmaSenhaInput.value;

        if (!confirmacao) {
            setInvalido(confirmaSenhaInput, feedback, 'Por favor, confirme sua senha.');
            return false;
        }

        if (senha !== confirmacao) {
            setInvalido(confirmaSenhaInput, feedback, 'As senhas não coincidem. Digite a mesma senha.');
            return false;
        }

        setValido(confirmaSenhaInput, feedback);
        return true;
    }

    // Validação do Checkbox de Termos
    function validaTermosInput() {
        const feedback = document.getElementById('feedbackTermos');
        if (!termosInput.checked) {
            termosInput.classList.remove('is-valid');
            termosInput.classList.add('is-invalid');
            if (feedback) feedback.textContent = 'Você deve aceitar os Termos de Uso para continuar.';
            return false;
        }

        termosInput.classList.remove('is-invalid');
        termosInput.classList.add('is-valid');
        if (feedback) feedback.textContent = '';
        return true;
    }

    /* ==========================================================================
       4. ALTERNÂNCIA DE EXIBIÇÃO DE SENHA (VER / OCULTAR)
       ========================================================================== */
    function configurarToggleSenha(btn, input) {
        if (!btn || !input) return;
        btn.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
            }
            btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Ver senha em texto');
        });
    }

    configurarToggleSenha(toggleSenhaBtn, senhaInput);
    configurarToggleSenha(toggleConfirmaBtn, confirmaSenhaInput);

    /* ==========================================================================
       5. LISTENERS DE EVENTOS EM TEMPO REAL (INPUT E BLUR)
       ========================================================================== */
    nomeInput.addEventListener('blur', validaNomeInput);
    nomeInput.addEventListener('input', () => {
        if (nomeInput.classList.contains('is-invalid')) validaNomeInput();
    });

    emailInput.addEventListener('blur', validaEmailInput);
    emailInput.addEventListener('input', () => {
        if (emailInput.classList.contains('is-invalid')) validaEmailInput();
    });

    cpfInput.addEventListener('blur', validaCpfInput);

    telefoneInput.addEventListener('blur', validaTelefoneInput);

    nascimentoInput.addEventListener('blur', validaNascimentoInput);
    nascimentoInput.addEventListener('change', validaNascimentoInput);

    senhaInput.addEventListener('input', () => {
        avaliaForcaSenha(senhaInput.value);
        if (senhaInput.classList.contains('is-invalid')) validaSenhaInput();
    });
    senhaInput.addEventListener('blur', validaSenhaInput);

    confirmaSenhaInput.addEventListener('input', () => {
        if (confirmaSenhaInput.classList.contains('is-invalid')) validaConfirmaSenhaInput();
    });
    confirmaSenhaInput.addEventListener('blur', validaConfirmaSenhaInput);

    termosInput.addEventListener('change', validaTermosInput);

    /* ==========================================================================
       6. ENVIO DO FORMULÁRIO (SUBMIT)
       ========================================================================== */
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Executa todas as validações
        const okNome = validaNomeInput();
        const okEmail = validaEmailInput();
        const okCpf = validaCpfInput();
        const okTelefone = validaTelefoneInput();
        const okNasc = validaNascimentoInput();
        const okSenha = validaSenhaInput();
        const okConfirma = validaConfirmaSenhaInput();
        const okTermos = validaTermosInput();

        const formularioValido = okNome && okEmail && okCpf && okTelefone &&
                                 okNasc && okSenha && okConfirma && okTermos;

        if (!formularioValido) {
            // Localiza e foca no primeiro campo com erro para orientar o usuário
            const primeiroInvalido = form.querySelector('.is-invalid');
            if (primeiroInvalido) {
                primeiroInvalido.focus();
                primeiroInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Formulário 100% válido: exibe resumo e confirmação
        if (resumoNome) resumoNome.textContent = nomeInput.value;
        if (resumoEmail) resumoEmail.textContent = emailInput.value;
        if (resumoCpf) resumoCpf.textContent = cpfInput.value;

        if (modalSucesso) {
            modalSucesso.show();
        } else {
            alert(`Cadastro realizado com sucesso, ${nomeInput.value}!\nSeja bem-vindo(a) ao IngressosFácil.`);
        }

        // Limpa formulário e status visuais
        form.reset();
        [nomeInput, emailInput, cpfInput, telefoneInput, nascimentoInput, senhaInput, confirmaSenhaInput, termosInput].forEach(limpaStatus);
        strengthBar.className = 'password-strength-bar';
        strengthBar.style.width = '0%';
        strengthText.textContent = '';
        [reqLength, reqLetter, reqNumber, reqSpecial].forEach(el => atualizaRequisito(el, false));
    });
});
