// == API Choki - TCC 2026 == \\

// Carrega as variáveis do .env
import dotenv from "dotenv";
dotenv.config();

// Importação das bibliotecas necessárias
import express from "express";
import bcryptjs from "bcryptjs";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import jwt from "jsonwebtoken";

const upload = multer({ storage: multer.memoryStorage() });

// Conecta ao Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Declaração das variáveis de cada biblioteca
const app = express();
app.use(express.json());

app.use(cors());

const autenticar = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ erro: "Token não fornecido" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = decoded.id;
        next();
    } catch {
        res.status(401).json({ erro: "Token inválido" });
    }
};


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
        const { email, username, password } = req.body;

        const passwordhash = await bcryptjs.hash(password, 10);

        const { data, error } = await supabase
            .from('usuario')
            .insert({
                email: email,
                username: username,
                password: passwordhash
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
app.get("/api/auth/usuario/:id", autenticar, async (req, res) => {
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

        const token = jwt.sign({ id: data.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({ id: data.id, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao realizar login" });
    }
});

// - Atualiza usuário
app.put("/api/auth/usuario/:id", autenticar, async (req, res) => {
    try {
        const { id } = req.params;

        const { email, username, meta_diaria_kwh, meta_mensal_reais, tarifa_eletrica } = req.body;

        const { data, error } = await supabase
            .from('usuario')
            .update({
                email: email,
                username: username,
                meta_diaria_kwh: meta_diaria_kwh,
                meta_mensal_reais: meta_mensal_reais,
                tarifa_eletrica: tarifa_eletrica
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ erro: error.message });

        const { password: _, ...dadosAtualizados } = data;
        res.status(200).json(dadosAtualizados);
    } catch (error) {
        console.log(error);
        res.status(500).json({ erro: "Falha ao atualizar usuário" });
    }
});

// - Altera o status do usuário
app.put("/api/auth/statusUsuario/:id", autenticar, async (req, res) => {
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
app.delete("/api/auth/usuario/:id", autenticar, async (req, res) => {
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
app.post("/api/auth/comodo", autenticar, async (req, res) => {
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
app.get("/api/auth/comodo/:id", autenticar, async (req, res) => {
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
app.put("/api/auth/comodo/:id", autenticar, async (req, res) => {
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
app.delete("/api/auth/comodo/:id", autenticar, async (req, res) => {
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
app.post("/api/auth/aparelho", autenticar, async (req, res) => {
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
app.get("/api/auth/aparelho/:id", autenticar, async (req, res) => {
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
app.put("/api/auth/aparelho/:id", autenticar, async (req, res) => {
    try {
        const { id } = req.params;

        const { nome, descricao, horas_uso_dia, dias_uso_mes, id_comodo } = req.body;

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
app.delete("/api/auth/aparelho/:id", autenticar, async (req, res) => {
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
app.get("/api/auth/leitura/:id", autenticar, async (req, res) => {
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
app.get("/api/auth/leitura/:id/agora", autenticar, async (req, res) => {
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
app.get("/api/auth/leitura/:id/hoje", autenticar, async (req, res) => {
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
app.get("/api/auth/leitura/:id/mensal", autenticar, async (req, res) => {
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
app.delete("/api/auth/leitura/:id", autenticar, async (req, res) => {
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


// - Rotas de upload (fotos)
// - Uploado do usuário
app.post("/api/auth/upload/usuario/:id", autenticar, upload.single("foto"), async (req, res) => {
    try {
        const { id } = req.params;
        const arquivo = req.file;

        if (!arquivo) return res.status(400).json({ erro: "Nenhuma foto enviada" });

        const nomeArquivo = `usuarios/${id}-${Date.now()}`;

        const { error: uploadError } = await supabase.storage
            .from("fotos")
            .upload(nomeArquivo, arquivo.buffer, {
                contentType: arquivo.mimetype
            });

        if (uploadError) return res.status(500).json({ erro: uploadError.message });

        const { data } = supabase.storage
            .from("fotos")
            .getPublicUrl(nomeArquivo);

        await supabase
            .from("usuario")
            .update({ foto_url: data.publicUrl })
            .eq("id", id);

        res.status(200).json({ foto_url: data.publicUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao fazer upload" });
    }
});

// - Upload do cômodo
app.post("/api/auth/upload/comodo/:id", autenticar, upload.single("foto"), async (req, res) => {
    try {
        const { id } = req.params;
        const arquivo = req.file;

        if (!arquivo) return res.status(400).json({ erro: "Nenhuma foto enviada" });

        const nomeArquivo = `comodos/${id}-${Date.now()}`;

        const { error: uploadError } = await supabase.storage
            .from("fotos")
            .upload(nomeArquivo, arquivo.buffer, {
                contentType: arquivo.mimetype
            });

        if (uploadError) return res.status(500).json({ erro: uploadError.message });

        const { data } = supabase.storage
            .from("fotos")
            .getPublicUrl(nomeArquivo);

        await supabase
            .from("comodo")
            .update({ foto_url: data.publicUrl })
            .eq("id", id);

        res.status(200).json({ foto_url: data.publicUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao fazer upload" });
    }
});

// - Upload do aparelho
app.post("/api/auth/upload/aparelho/:id", autenticar, upload.single("foto"), async (req, res) => {
    try {
        const { id } = req.params;
        const arquivo = req.file;

        if (!arquivo) return res.status(400).json({ erro: "Nenhuma foto enviada" });

        const nomeArquivo = `aparelhos/${id}-${Date.now()}`;

        const { error: uploadError } = await supabase.storage
            .from("fotos")
            .upload(nomeArquivo, arquivo.buffer, {
                contentType: arquivo.mimetype
            });

        if (uploadError) return res.status(500).json({ erro: uploadError.message });

        const { data } = supabase.storage
            .from("fotos")
            .getPublicUrl(nomeArquivo);

        await supabase
            .from("aparelho")
            .update({ foto_url: data.publicUrl })
            .eq("id", id);

        res.status(200).json({ foto_url: data.publicUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Falha ao fazer upload" });
    }
});


//=============================================================================================================================


//== Inicialização ==\\
app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
