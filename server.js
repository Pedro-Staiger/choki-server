// == API Choki - TCC 2026 == \\

// Carrega as variáveis do .env
import dotenv from "dotenv";
dotenv.config();

// Importação das bibliotecas necessárias
import express from "express";
import bcryptjs from "bcryptjs";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Conecta ao Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Declaração das variáveis de cada biblioteca
const app = express();
app.use(express.json());

app.use(cors());


//=============================================================================================================================


// == Início das rotas HTTP == \\

// - Rota de boas vindas
app.get("/", async (req, res) => {
    try {
        res.status(200).json({ "mensagem": "Bem-vindo ao servidor da Choki!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: error });
    }
})


//=============================================================================================================================


// - Rotas do usuário
// - Cria usuário
app.post("/api/usuario", async (req, res) => {
    try {
        const { email, username, password, tarifa_eletrica, categoria, nivel_consumo } = req.body;

        const passwordhash = await bcryptjs.hash(password, 10);

        const { data, error } = await supabase
            .from('usuario')
            .insert({
                email: email,
                username: username,
                password: passwordhash,
                tarifa_eletrica: tarifa_eletrica,
                categoria: categoria,
                nivel_consumo: nivel_consumo
            })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar usuário" });
    }
});

// - Consulta usuário específico
app.get("/api/usuario/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return res.status(404).json({ erro: "Usuário não encontrado" });

        const { password: _, ...dadosLogin } = data;

        res.status(200).json(dadosLogin);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao buscar usuário" });
    }
});

// - Realiza login e retorna os dados
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', email)
            .single();

        if (error) return res.status(404).json({ erro: "Usuário não encontrado" });

        if (!data.status) {
            return res.status(401).json({ erro: "Usuário desativado" });
        }

        const senhaValida = await bcryptjs.compare(password, data.password);

        if (!senhaValida) {
            return res.status(401).json({ erro: "Informações inválidas" });
        }

        const { password: _, ...dadosLogin } = data;

        res.status(200).json(dadosLogin);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao realizar login" });
    }
});

// - Atualiza usuário
app.put("/api/usuario/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { email, username, password, tarifa_eletrica, categoria, nivel_consumo } = req.body;

        let passwordhash;
        if (password) {
            passwordhash = await bcryptjs.hash(password, 10);
        }

        const { data, error } = await supabase
            .from('usuario')
            .update({
                email: email,
                username: username,
                ...(passwordhash && { password: passwordhash }),
                tarifa_eletrica: tarifa_eletrica,
                categoria: categoria,
                nivel_consumo: nivel_consumo
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ erro: "Falha ao atualizar usuário" });
    }
});

// - Altera o status do usuário
app.put("/api/statusUsuario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('usuario')
            .select('status')
            .eq('id', id)
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        const novoStatus = !data.status;

        const { data: dataUpdate, error: errorUpdate } = await supabase
            .from('usuario')
            .update({ status: novoStatus })
            .eq('id', id)
            .select()
            .single();

        if (errorUpdate) return res.status(500).json({ erro: errorUpdate.message });

        res.status(200).json(dataUpdate);
    } catch (error) {
        console.log(error);
        res.status(500).json({ erro: "Falha ao alterar status do usuário" });
    }
});

// - Deleta usuário
app.delete("/api/usuario/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('usuario')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ erro: error.message });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao deletar usuário" });
    }
});


//=============================================================================================================================


// - Rotas de cômodo
// - Cria cômodo
app.post("/api/comodo", async (req, res) => {
    try {
        const { id_usuario, nome, descricao } = req.body;

        const { data, error } = await supabase
            .from('comodo')
            .insert({
                id_usuario: id_usuario,
                nome: nome,
                descricao: descricao,
            })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar cômodo" });
    }
});

// - Busca todos cômodos de um usuário
app.get("/api/comodo/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('comodo')
            .select('*')
            .eq('id_usuario', id)

        if (error) return res.status(404).json({ erro: "Cômodo(s) não encontrado(s)" });

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao buscar cômodo(s)" });
    }
});

// - Atualiza cômodo
app.put("/api/comodo/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { nome, descricao } = req.body;

        const { data, error } = await supabase
            .from('comodo')
            .update({
                nome: nome,
                descricao: descricao
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ erro: "Falha ao atualizar cômodo" });
    }
});

// - Deleta cômodo
app.delete("/api/comodo/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('comodo')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ erro: error.message });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao deletar cômodo" });
    }
});


//=============================================================================================================================


// - Rotas do aparelho
// - Cria aparelho
app.post("/api/aparelho", async (req, res) => {
    try {
        const { id_usuario, nome, descricao, horas_uso_dia, dias_uso_mes } = req.body;

        const { data, error } = await supabase
            .from('aparelho')
            .insert({
                id_usuario: id_usuario,
                nome: nome,
                descricao: descricao,
                horas_uso_dia: horas_uso_dia,
                dias_uso_mes: dias_uso_mes
            })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar aparelho" });
    }
});

// - Busca todos aparelhos de um usuário
app.get("/api/aparelho/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('aparelho')
            .select('*')
            .eq('id_usuario', id)

        if (error) return res.status(404).json({ erro: "Aparelho(s) não encontrado(s)" });

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao buscar aparelho(s)" });
    }
});

// - Atualiza aparelho
app.put("/api/aparelho/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { nome, descricao, horas_uso_dia, dias_uso_mes, id_comodo  } = req.body;

        const { data, error } = await supabase
            .from('aparelho')
            .update({
                nome: nome,
                descricao: descricao,
                horas_uso_dia: horas_uso_dia,
                dias_uso_mes: dias_uso_mes,
                id_comodo: id_comodo
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ erro: "Falha ao atualizar aparelho" });
    }
});

// - Deleta aparelho
app.delete("/api/aparelho/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('aparelho')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ erro: error.message });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao deletar aparelho" });
    }
});


//=============================================================================================================================


// - Rotas da leitura
// - Cria leitura
app.post("/api/leitura", async (req, res) => {
    try {
        const { id_aparelho, tensao, corrente, potencia, energia_kwh } = req.body;

        const { data, error } = await supabase
            .from('leitura')
            .insert({
                id_aparelho: id_aparelho,
                tensao: tensao,
                corrente: corrente,
                potencia: potencia,
                energia_kwh: energia_kwh
            })
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao criar leitura" });
    }
});

// - Busca todas leituras de um aparelho
app.get("/api/leitura/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('leitura')
            .select('*')
            .eq('id_aparelho', id)

        if (error) return res.status(404).json({ erro: "Leitura(s) não encontrada(s)" });

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao buscar leitura(s)" });
    }
});

// - Busca todas leituras de um aparelho (mais recente)
app.get("/api/leitura/:id/agora", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('leitura')
            .select('*')
            .eq('id_aparelho', id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single()

        if (error) return res.status(404).json({ erro: "Leitura(s) não encontrada(s)" });

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao buscar leitura(s)" });
    }
});

// - Busca todas leituras de um aparelho das últimas 24h 
app.get("/api/leitura/:id/hoje", async (req, res) => {
    try {
        const { id } = req.params;

        const agora = new Date();
        const ultimas24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('leitura')
            .select('*')
            .eq('id_aparelho', id)
            .gte('timestamp', ultimas24h.toISOString())

        if (error) return res.status(404).json({ erro: "Leitura(s) não encontrada(s)" });

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao buscar leitura(s)" });
    }
});

// - Busca todas leituras de um aparelho dos últimos 30 dias
app.get("/api/leitura/:id/mensal", async (req, res) => {
    try {
        const { id } = req.params;

        const agora = new Date();
        const ultimos30dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('leitura')
            .select('*')
            .eq('id_aparelho', id)
            .gte('timestamp', ultimos30dias.toISOString())

        if (error) return res.status(404).json({ erro: "Leitura(s) não encontrada(s)" });

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao buscar leitura(s)" });
    }
});

// - Deleta leitura
app.delete("/api/leitura/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('leitura')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ erro: error.message });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao deletar leitura" });
    }
});


//=============================================================================================================================


//== Inicialização ==\\
app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
