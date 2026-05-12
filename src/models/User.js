import prisma from '../configs/prisma.js';



// định dạng lại data
const formatUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
};




//tìm duy nhất
const findByEmail = async (email) => {
  const user = await prisma.users.findUnique({
    where: {
      email
    }
  });

  return formatUser(user);
};


const findById = async (id) => {
  const user = await prisma.users.findUnique({
    where: {
      id
    }
  });

  return formatUser(user);
};

const createUser = async ({ name, email, password, phone, role = 'user' }) => {
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password,
      phone: phone || null,
      role
    }
  });

  return formatUser(user);
};


const updateProfileById = async (id, { name, phone }) => {
  try {
    const user = await prisma.users.update({
      where: {
        id
      },
      data: {
        name,
        phone: phone || null
      }
    });

    return formatUser(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }

    throw error;
  }
};

/* reset pass */
const saveResetToken = async (userId, token, expiresAt) => {
  await prisma.users.update({
    where: {
      id: userId
    },
    data: {
      reset_password_token: token,
      reset_password_expires: expiresAt
    }
  });
};

const findByResetToken = async (token) => {
  const user = await prisma.users.findFirst({
    where: {
      reset_password_token: token
    },
    select: {
      id: true,
      name: true,
      email: true,
      reset_password_expires: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    resetPasswordExpires: user.reset_password_expires
  };
};

const updatePassword = async (userId, hashedPassword) => {
  await prisma.users.update({
    where: {
      id: userId
    },
    data: {
      password: hashedPassword
    }
  });
};

const clearResetToken = async (userId) => {
  try {
    await prisma.users.update({
      where: {
        id: userId
      },
      data: {
        reset_password_token: null,
        reset_password_expires: null
      }
    });
    return true;

  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error
  }
};


/* user GG */


const createGoogleUser = async ({ name, email }) => {
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: '',
      phone: null,
      role: 'user'
    }
  });

  return formatUser(user);
};


export {
  findByEmail,
  findById,
  createUser,
  updateProfileById,
  saveResetToken,
  findByResetToken,
  updatePassword,
  clearResetToken,
  createGoogleUser
};
/*xuất module này để dùng lại */